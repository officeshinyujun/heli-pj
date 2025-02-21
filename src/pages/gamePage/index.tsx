import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect, useRef, useState } from "react";
import { RigidBody, Physics } from "@react-three/rapier";
import * as THREE from "three";
import styles from "./index.module.scss";

interface ModelProps {
    position: [number, number, number];
    heliRef: any;
    cameraRef: any;
}

function HeliModel({ position, heliRef, cameraRef }: ModelProps) {
    const gltf = useLoader(GLTFLoader, "/bell_huey_helicopter.glb");
    const speed = 0.3;
    const rotationSpeed = 0.005;
    const dampingFactor = 0.98;
    const verticalSpeed = 0.2;
    const tiltIncrement = 0.001; // 기울어지는 속도
    const restoreFactor = 0.5;  // 복구 속도 (0~1, 1에 가까울수록 원래 자세로 빠르게 복귀)
    const maxTilt = Math.PI / 24; // 최대 기울기 (15도)

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

    useFrame(({ camera }) => {
        if (heliRef.current) {
            const rigidBody = heliRef.current;
            const currentVelocity = rigidBody.linvel();
            let newYaw = yawAngle;

            if (keyState.a) newYaw += rotationSpeed;
            if (keyState.d) newYaw -= rotationSpeed;

            const forward = new THREE.Vector3(Math.sin(newYaw), 0, Math.cos(newYaw));
            const moveX = (keyState.w ? forward.x : 0) - (keyState.s ? forward.x : 0);
            const moveZ = (keyState.w ? forward.z : 0) - (keyState.s ? forward.z : 0);
            const yMove = (keyState.space ? verticalSpeed : 0) - (keyState.shift ? verticalSpeed : 0);

            // 기울기 업데이트 (한계값 적용)
            let newPitch = pitchAngle;
            let newRoll = rollAngle;

            // 방향에 따른 기울기 조정: 앞, 뒤, 좌, 우
            if (keyState.w) newPitch = Math.min(maxTilt, newPitch + tiltIncrement);  // 앞
            else if (keyState.s) newPitch = Math.max(-maxTilt, newPitch - tiltIncrement);  // 뒤
            else newPitch *= restoreFactor;

            if (keyState.a) newRoll = Math.max(-maxTilt, newRoll - tiltIncrement);  // 좌
            else if (keyState.d) newRoll = Math.min(maxTilt, newRoll + tiltIncrement);  // 우
            else newRoll *= restoreFactor;

            // 최종 회전 적용 (Yaw, Pitch, Roll)
            const euler = new THREE.Euler(newPitch, newYaw, newRoll, "YXZ");
            const quaternion = new THREE.Quaternion().setFromEuler(euler);

            rigidBody.setLinvel(
                {
                    x: currentVelocity.x * dampingFactor + moveX * speed,
                    y: currentVelocity.y * dampingFactor + yMove,
                    z: currentVelocity.z * dampingFactor + moveZ * speed,
                },
                true
            );

            rigidBody.setRotation(
                {
                    x: quaternion.x,
                    y: quaternion.y,
                    z: quaternion.z,
                    w: quaternion.w,
                },
                true
            );

            // 카메라 따라가기
            if (cameraRef.current) {
                const heliPos = rigidBody.translation();
                const offset = new THREE.Vector3(0, 5, -10).applyQuaternion(
                    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, newYaw, 0, "YXZ"))
                );
                const targetPosition = new THREE.Vector3(
                    heliPos.x,
                    heliPos.y,
                    heliPos.z
                ).add(offset);

                camera.position.lerp(targetPosition, 0.1);
                camera.lookAt(heliPos.x, heliPos.y, heliPos.z);
            }

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
    const cameraRef = useRef(null);

    return (
        <div className={styles.container} style={{ background: "gray" }}>
            <Canvas camera={{ position: [0, 10, -10], fov: 75 }} ref={cameraRef}>
                <Physics debug={false}>
                    <ambientLight intensity={10} position={[0, 10, 0]} />
                    <HeliModel position={[0, 10, 0]} heliRef={heliRef} cameraRef={cameraRef} />
                    <RigidBody type="fixed">
                        <mesh>
                            <boxGeometry args={[30, 1, 30]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>
                    </RigidBody>
                </Physics>
            </Canvas>
        </div>
    );
}
