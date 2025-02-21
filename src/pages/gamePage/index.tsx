import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { RigidBody, Physics } from "@react-three/rapier";
import * as THREE from "three";
import styles from "./index.module.scss";

interface ModelProps {
    position: [number, number, number];
    heliRef: any;
}

function HeliModel({ position, heliRef }: ModelProps) {
    const gltf = useLoader(GLTFLoader, "/bell_huey_helicopter.glb");
    const speed = 0.5;
    const rotationSpeed = 0.005;
    const dampingFactor = 0.95;
    const verticalSpeed = 0.3;
    const tiltFactor = 0.01; // 기울기 강도
    const recoverySpeed = 0.05; // 복원 속도

    // 회전 상태 (Yaw, Pitch, Roll)
    const [yawAngle, setYawAngle] = useState(0);
    const [pitchAngle, setPitchAngle] = useState(0);
    const [rollAngle, setRollAngle] = useState(0);

    const [keyState, setKeyState] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false,
        space: false,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
            case "w":
                setKeyState((prev) => ({ ...prev, w: true }));
                break;
            case "a":
                setKeyState((prev) => ({ ...prev, a: true }));
                break;
            case "s":
                setKeyState((prev) => ({ ...prev, s: true }));
                break;
            case "d":
                setKeyState((prev) => ({ ...prev, d: true }));
                break;
            case "shift":
                setKeyState((prev) => ({ ...prev, shift: true }));
                break;
            case " ":
                setKeyState((prev) => ({ ...prev, space: true }));
                break;
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
            case "w":
                setKeyState((prev) => ({ ...prev, w: false }));
                break;
            case "a":
                setKeyState((prev) => ({ ...prev, a: false }));
                break;
            case "s":
                setKeyState((prev) => ({ ...prev, s: false }));
                break;
            case "d":
                setKeyState((prev) => ({ ...prev, d: false }));
                break;
            case "shift":
                setKeyState((prev) => ({ ...prev, shift: false }));
                break;
            case " ":
                setKeyState((prev) => ({ ...prev, space: false }));
                break;
        }
    };

    useFrame(() => {
        if (heliRef.current) {
            const rigidBody = heliRef.current;
            const currentVelocity = rigidBody.linvel();

            // 회전값 업데이트 (Yaw)
            let newYaw = yawAngle;
            if (keyState.a) newYaw += rotationSpeed;
            if (keyState.d) newYaw -= rotationSpeed;

            // 이동 벡터 계산
            const moveX = (keyState.w ? Math.sin(newYaw) : 0) - (keyState.s ? Math.sin(newYaw) : 0);
            const moveZ = (keyState.w ? Math.cos(newYaw) : 0) - (keyState.s ? Math.cos(newYaw) : 0);
            const yMove = (keyState.space ? verticalSpeed : 0) - (keyState.shift ? verticalSpeed : 0);

            // 기울기 업데이트 (Yaw 방향 고려)
            let newPitch = pitchAngle;
            let newRoll = rollAngle;

            if (keyState.w) newPitch += tiltFactor * Math.cos(newYaw); // 전진 시 Pitch 감소
            if (keyState.s) newPitch -= tiltFactor * Math.cos(newYaw); // 후진 시 Pitch 증가
            if (keyState.a) newRoll -= tiltFactor * Math.sin(newYaw);  // 좌회전 시 Roll 증가
            if (keyState.d) newRoll += tiltFactor * Math.sin(newYaw);  // 우회전 시 Roll 감소

            // 복원 로직: 입력이 없으면 점점 0도로 되돌림
            newPitch *= dampingFactor;
            newRoll *= dampingFactor;

            // Quaternion으로 회전 적용
            const quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(new THREE.Euler(newPitch, newYaw, newRoll));

            // Rigidbody 업데이트
            rigidBody.setLinvel({
                x: currentVelocity.x * dampingFactor + moveX * speed,
                y: currentVelocity.y * dampingFactor + yMove,
                z: currentVelocity.z * dampingFactor + moveZ * speed
            }, true);

            rigidBody.setRotation({
                x: quaternion.x,
                y: quaternion.y,
                z: quaternion.z,
                w: quaternion.w
            }, true);

            // 상태 업데이트
            setYawAngle(newYaw);
            setPitchAngle(newPitch);
            setRollAngle(newRoll);
        }
    });

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    return (
        <RigidBody
            ref={heliRef}
            position={position}
            enabledRotations={[true, true, true]}
            type="dynamic"
            mass={5}
            gravityScale={0.2}
            linearDamping={0.5}
            angularDamping={0.9}
        >
            <primitive object={gltf.scene} />
        </RigidBody>
    );
}

export default function GamePage() {
    const heliRef = useRef(null);

    return (
        <div className={styles.container} style={{ background: "gray" }}>
            <Canvas>
                <Physics debug={true}>
                    <ambientLight intensity={10} position={[0, 10, 0]} />
                    <HeliModel position={[0, 10, 0]} heliRef={heliRef} />
                    <RigidBody type="fixed">
                        <mesh>
                            <boxGeometry args={[300, 1, 300]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>
                    </RigidBody>
                    <OrbitControls />
                </Physics>
            </Canvas>
        </div>
    );
}
