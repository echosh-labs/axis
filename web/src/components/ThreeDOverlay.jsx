// Copyright (c) 2026 Justin Andrew Wood. All rights reserved.
// This software is licensed under the AGPL-3.0.
// Commercial licensing is available at echosh-labs.com.
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Edges } from '@react-three/drei';

function RotatingGeometry() {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.15;
        }
    });

    return (
        <mesh ref={meshRef} scale={2}>
            {/* We use an icosahedron to get a retro globe/wireframe look */}
            <Icosahedron args={[1, 1]}>
                <meshBasicMaterial color="#000000" transparent opacity={0.8} />
                <Edges scale={1.05} threshold={15} color="#10b981" />
            </Icosahedron>
        </mesh>
    );
}

export default function ThreeDOverlay() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <RotatingGeometry />
            </Canvas>
        </div>
    );
}
