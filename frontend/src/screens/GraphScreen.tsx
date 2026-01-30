
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Image as SvgImage, Defs, ClipPath, Ellipse } from 'react-native-svg';
import SvgPanZoom from 'react-native-svg-pan-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { useConnections } from '../hooks/useConnections';
import { useMe } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { friendsApi } from '../api/endpoints';


export default function GraphScreen() {
  const { width, height } = Dimensions.get('window');
  const { data, isLoading, error } = useConnections();
  const { data: me } = useMe();
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [userInfoMap, setUserInfoMap] = useState<Record<string, { name: string; email: string; avatar: string }>>({});

  // Node sizes
  const baseNodeSizeCenter = 54;
  const baseNodeSizeOther = 22;

  useEffect(() => {
    if (!data || !me) return;
    const graph = data.graph || [];
    const nodeIds = Array.from(new Set(graph.flatMap(edge => [edge.source, edge.target])));
    if (nodeIds.length === 0) return;

    // Fetch user info for each node using useFriends
    const fetchAllUserInfo = async () => {
      const userMap: Record<string, { name: string; email: string; avatar: string }> = {};
      for (const id of nodeIds) {
        try {
          const res = await friendsApi.list(id);
          if (res.data && res.data.user) {
            userMap[id] = {
              name: res.data.user.name,
              email: res.data.user.email,
              avatar: res.data.user.get_avatar,
            };
          }
        } catch (e) {
          userMap[id] = { name: 'Unknown', email: 'Unknown', avatar: '' };
        }
      }
      setUserInfoMap(userMap);
      // Print out for validation
      Object.entries(userMap).forEach(([id, info]) => {
        console.log(`User ${id}: Name=${info.name}, Email=${info.email}, Avatar=${info.avatar}`);
      });
    };
    fetchAllUserInfo();

    // Use d3-force to compute a layout for nodes and links.
    const simNodes: any[] = nodeIds.map(id => ({ 
      id, 
      radius: id === me.id ? baseNodeSizeCenter + 15 : baseNodeSizeOther + 15 
    }));
    const simLinks = graph.map((e: any) => ({ source: e.source, target: e.target, distance: 150 }));

    const simulation = forceSimulation(simNodes)
      .force('charge', forceManyBody().strength(-600))
      .force('link', forceLink(simLinks).id((d: any) => d.id).distance((d: any) => d.distance || 150).strength(0.5))
      .force('collide', forceCollide().radius((d: any) => d.radius).iterations(5))
      .force('center', forceCenter(width / 2, height / 2));

    // Run simulation synchronously for a number of ticks to produce stable layout
    simulation.stop();
    const ticks = Math.min(1000, Math.max(300, nodeIds.length * 20));
    for (let i = 0; i < ticks; i++) simulation.tick();

    const nodesArr = simNodes.map(n => ({ id: n.id, x: n.x ?? width / 2, y: n.y ?? height / 2 }));
    setNodes(nodesArr);
    setLinks(graph);

    // clean up simulation
    simulation.stop();
  }, [data, me]);

  return (
    <View style={styles.container}>
      <SvgPanZoom
        canvasWidth={width}
        canvasHeight={height}
        minScale={0.5}
        maxScale={3}
        initialZoom={1}
        style={{ flex: 1 }}
      >
        <Svg width={width} height={height}>
          {/* Draw edges */}
          {links.map((link, i) => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (!source || !target) return null;
            return (
              <Line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#c0bebe"
                strokeWidth={2}
              />
            );
          })}
          {/* Draw nodes */}
          <Defs>
            {nodes.map((node) => {
              const isCenter = node.id === me.id;
              const baseNodeSize = isCenter ? baseNodeSizeCenter : baseNodeSizeOther;
              return (
                <ClipPath id={`clip-${node.id}`} key={`clip-${node.id}`}>
                  <Ellipse cx={node.x} cy={node.y} rx={baseNodeSize} ry={baseNodeSize} />
                </ClipPath>
              );
            })}
          </Defs>
          {nodes.map((node) => {
            const userInfo = userInfoMap[node.id];
            const isCenter = node.id === me.id;
            const baseNodeSize = isCenter ? baseNodeSizeCenter : baseNodeSizeOther;
            const borderR = baseNodeSize + 3;
            return (
              <React.Fragment key={node.id}>
                {/* Draw border first */}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={borderR}
                  fill={isCenter ? "#F4C430" : "#4F8EF7"}
                  stroke={isCenter ? "#F4C430" : "#4F8EF7"}
                  strokeWidth={3}
                />
                {/* Draw avatar image on top, clipped to baseNodeSize */}
                {userInfo?.avatar ? (
                  <SvgImage
                    x={node.x - baseNodeSize}
                    y={node.y - baseNodeSize}
                    width={baseNodeSize * 2}
                    height={baseNodeSize * 2}
                    href={{ uri: userInfo.avatar }}
                    clipPath={`url(#clip-${node.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : null}
                {/* Draw label */}
                <SvgText
                  x={node.x}
                  y={node.y + borderR + 20}
                  fontSize="16"
                  fill="#000000"
                  textAnchor="middle"
                >
                  {userInfo?.name || ''}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </SvgPanZoom>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    color: '#333',
  },
});
