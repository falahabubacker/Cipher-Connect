import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMe } from '../hooks/useAuth';
import { friendsApi } from '../api/endpoints';
import { useConnections } from '../hooks/useConnections';

interface UserInfo {
  name: string;
  email: string;
  avatar: string;
}

interface EdgeData {
  source: string;
  target: string;
}

interface GraphScreenProps {
  me: any;
}

const GraphScreen = () => {
  const webViewRef = useRef<WebView>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const { data: me } = useMe();

  // 1. Fetch the graph structure using your hook
  const { 
    data: connectionsData, 
    isLoading: isLoadingConnections, 
    isError: isConnectionsError 
  } = useConnections();

  // 2. Extract unique node IDs from the graph
  const nodeIds = useMemo(() => {
    if (!connectionsData?.graph) return [];
    const ids = connectionsData.graph.flatMap(edge => [edge.source, edge.target]);
    return Array.from(new Set(ids));
  }, [connectionsData]);

  // 3. Fetch all user details in parallel using React Query's useQueries
  // This automatically uses the caching logic from your useFriends implementation
  const userQueries = useQueries({
    queries: nodeIds.map((id) => ({
      queryKey: ['friends', id],
      queryFn: async () => {
        const { data } = await friendsApi.list(id);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    })),
  });

  const isLoadingUsers = userQueries.some((query) => query.isLoading);
  const isAnyUserError = userQueries.some((query) => query.isError);

  // 4. Map the results into the userInfoMap format
  const userInfoMap = useMemo(() => {
    const map: Record<string, UserInfo> = {};
    nodeIds.forEach((id, index) => {
      const queryResult = userQueries[index]?.data;
      if (queryResult?.user) {
        map[id] = {
          name: queryResult.user.name,
          email: queryResult.user.email,
          avatar: queryResult.user.get_avatar,
        };
      } else {
        map[id] = { name: 'Loading...', email: '', avatar: '' };
      }
    });
    return map;
  }, [nodeIds, userQueries]);

  // 5. Update WebView when data and bridge are ready
  useEffect(() => {
    const hasData = Object.keys(userInfoMap).length > 0 && connectionsData?.graph;
    if (isWebViewReady && hasData && !isLoadingUsers) {
      updateWebViewGraph(connectionsData!.graph, userInfoMap);
    }
  }, [isWebViewReady, userInfoMap, connectionsData, isLoadingUsers]);

  const updateWebViewGraph = (graph: EdgeData[], userMap: Record<string, UserInfo>) => {
    const visNodes = Object.entries(userMap).map(([id, info]) => ({
      id: id,
      label: info.name,
      shape: 'circularImage',
      image: info.avatar || 'https://picsum.photos/200/200', 
      size: id === me?.id?.toString() ? 40 : 30,
      stroke: id === me?.id?.toString() ? '#F4C430' : '#4A90E2',
    }));

    const visEdges = graph.map(edge => ({
      from: edge.source,
      to: edge.target
    }));

    const script = `
      if (window.loadGraphData) {
        window.loadGraphData(${JSON.stringify(visNodes)}, ${JSON.stringify(visEdges)});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'READY') {
        setIsWebViewReady(true);
      }
    } catch (e) {
      console.error("Message error:", e);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <style>
          body, html, #mynetwork { 
            margin: 0; padding: 0; height: 100vh; width: 100vw; 
            background: #ffffff; overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="mynetwork"></div>
        <script>
          let network = null;
          let nodes = new vis.DataSet([]);
          let edges = new vis.DataSet([]);

          window.loadGraphData = (newNodes, newEdges) => {
            nodes.clear();
            edges.clear();
            nodes.add(newNodes);
            edges.add(newEdges);

            if (!network) {
              const container = document.getElementById("mynetwork");
              const options = {
                nodes: {
                  borderWidth: 2,
                  size: 30,
                  color: { border: '#4A90E2', background: '#ffffff' },
                  font: { color: '#333333', size: 12, face: 'arial', vadjust: 40 }
                },
                edges: { 
                  color: '#CCCCCC',
                  arrows: { to: { enabled: false, scaleFactor: 0.5 } }
                },
                physics: { 
                  enabled: true,
                  stabilization: { iterations: 100 },
                  barnesHut: { gravitationalConstant: -3000 }
                }
              };
              network = new vis.Network(container, { nodes, edges }, options);
              network.on("click", (p) => window.ReactNativeWebView.postMessage(JSON.stringify({type:'CLICK', p})));
            }
          };
          window.onload = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
        </script>
      </body>
    </html>
  `;

  if (isConnectionsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error loading connections.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(isLoadingConnections || isLoadingUsers) && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={onMessage}
        style={styles.webview}
        onLoadEnd={() => {
           webViewRef.current?.injectJavaScript('window.ReactNativeWebView.postMessage(JSON.stringify({ type: "READY" })); true;');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' }
});

export default GraphScreen;