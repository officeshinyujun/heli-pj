import {Canvas, useFrame, useLoader} from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {Suspense, useEffect, useRef, useState} from "react";
import { OrbitControls } from "@react-three/drei";
import { RigidBody, Physics } from "@react-three/rapier";
import styles from "./index.module.scss";

interface ModelProps {
    position: [number, number, number];
    heliRef: any;
}

function HeliModel({ position, heliRef }: ModelProps) {
    const gltf = useLoader(GLTFLoader, "/bell_huey_helicopter.glb");
    const speed = 0.5;  // 속도 증가
    const rotationSpeed = 0.2;
    const dampingFactor = 0.95; // 댐핑 계수 추가
    const verticalSpeed = 0.3;  // 수직 이동 속도

    const [keyState, setKeyState] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false,
        space: false,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
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
            case "Shift":
                setKeyState((prev) => ({ ...prev, shift: true }));
                break;
            case " ":
                setKeyState((prev) => ({ ...prev, space: true }));
                break;
            default:
                break;
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        switch (event.key) {
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
            case "Shift":
                setKeyState((prev) => ({ ...prev, shift: false }));
                break;
            case " ":
                setKeyState((prev) => ({ ...prev, space: false }));
                break;
            default:
                break;
        }
    };

    useFrame(() => {
        if (heliRef.current) {
            const rigidBody = heliRef.current;
            const currentVelocity = rigidBody.linvel();
            let xMove = 0;
            let yMove = 0;
            let zMove = 0;
            let tilt = 0;

            // 수평 이동
            if (keyState.w) zMove += speed;
            if (keyState.s) zMove -= speed;
            if (keyState.a){
                xMove += speed;

            }
            if (keyState.d) xMove -= speed;

            // 수직 이동 - 속도 증가
            if (keyState.shift) yMove -= verticalSpeed;
            if (keyState.space) yMove += verticalSpeed;

            // 기울기
            if (keyState.w) tilt = -rotationSpeed;
            if (keyState.s) tilt = rotationSpeed;

            // 댐핑 적용
            const dampedX = currentVelocity.x * dampingFactor;
            const dampedY = currentVelocity.y * dampingFactor;
            const dampedZ = currentVelocity.z * dampingFactor;

            // 새로운 속도 설정
            rigidBody.setLinvel({
                x: dampedX + xMove,
                y: dampedY + yMove,
                z: dampedZ + zMove
            }, true);

            rigidBody.setAngvel({ x: tilt, y: 0, z: 0 }, true);

            // 헬리콥터가 너무 낮게 떨어지지 않도록 최소 높이 유지
            const position = rigidBody.translation();
            if (position.y < 2) {
                rigidBody.setTranslation({ x: position.x, y: 2, z: position.z }, true);
                rigidBody.setLinvel({ x: dampedX, y: 0, z: dampedZ }, true);
            }
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
            mass={5}  // 질량 증가
            gravityScale={0.2}  // 중력 스케일 조정
            linearDamping={0.5}  // 선형 댐핑 추가
            angularDamping={0.9}  // 각도 댐핑 추가
        >
            <primitive object={gltf.scene} />
        </RigidBody>
    );
}

export default function GamePage() {
    const [helicopterPosition, setHelicopterPosition] = useState<[number, number, number]>([0, 10, 0]);
    const heliRef = useRef(null);

    return (
        <div className={styles.container} style={{ background: "gray" }}>
            <Canvas>
                <Physics debug={true}>
                    <ambientLight intensity={10} position={[0, 10, 0]} />
                    <HeliModel position={helicopterPosition} heliRef={heliRef} />
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