import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

function Scene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mouse.y * 0.2, 0.1);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mouse.x * 0.2, 0.1);
      
      // Dynamic distortion based on time
      const time = state.clock.getElapsedTime();
      (meshRef.current.material as any).distort = 0.4 + Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#39FF14" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#000000" />
      
      <Float speed={1.4} rotationIntensity={1.5} floatIntensity={2.3}>
        <mesh ref={meshRef} scale={3.5} position={[0, 0, -2]}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#080808"
            envMapIntensity={0.5}
            clearcoat={1}
            clearcoatOpacity={1}
            reflectivity={0.8}
            metalness={0.2}
            roughness={0}
            distort={0.4}
            speed={2}
          />
        </mesh>
      </Float>

      <Environment preset="night" />
    </>
  );
}

export function LiquidShadow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
}
