import styles from "./index.module.scss";
import { Canvas, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Suspense } from "react";
import {OrbitControls} from "@react-three/drei";

function Model() {
    const gltf = useLoader(GLTFLoader, "/bell_huey_helicopter.glb");
    return <primitive object={gltf.scene} />;
}

export default function GamePage() {
    return (
        <div className={styles.container} style={{background:"gray"}}>
            <Canvas>
                <ambientLight intensity={10} position={[0,10,0]} />
                <Suspense fallback={null}>
                    <Model />
                </Suspense>
                <OrbitControls/>
            </Canvas>
        </div>
    );
}
