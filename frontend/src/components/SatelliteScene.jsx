import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars, Trail, useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { EARTH_RADIUS, orbitPathPoints } from "../lib/orbits";

const TEXTURE_BASE_URL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879";
const LAYER_DEFS = [
  { name: "LEO", radius: EARTH_RADIUS + 2.9, color: "#93c5fd", opacity: 0.055 },
  { name: "MEO", radius: EARTH_RADIUS + 6.8, color: "#c4b5fd", opacity: 0.04 },
  { name: "GEO", radius: EARTH_RADIUS + 12.2, color: "#fde68a", opacity: 0.032 }
];

export function SatelliteScene({
  satellites,
  collisionPairs,
  selectedId,
  onSelect
}) {
  const selectedSatellite = satellites.find((satellite) => satellite.id === selectedId) ?? null;
  const collisionIds = useMemo(() => {
    const ids = new Set();
    collisionPairs.forEach((pair) => {
      ids.add(pair.from.id);
      ids.add(pair.to.id);
    });
    return ids;
  }, [collisionPairs]);

  const heatZones = useMemo(() => buildHeatZones(satellites), [satellites]);
  return (
    <div className="relative h-[620px] w-full">
      <Canvas camera={{ position: [0, 0, 28], fov: 48 }}>
        <color attach="background" args={["#010409"]} />
        <fog attach="fog" args={["#010409", 34, 78]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-18, 5, -16]} intensity={2.5} color="#1f6feb" />
        <pointLight position={[0, 20, 0]} intensity={0.9} color="#67e8f9" />

        <Stars radius={150} depth={90} count={2600} factor={3.2} saturation={0} fade speed={0.22} />
        <CameraDrift />
        <Earth />
        <CinematicOrbitField>
          <OrbitalLayers />
          <CongestionHeatmap zones={heatZones} />

          {satellites.map((satellite, index) => {
            const focused = !selectedSatellite || satellite.id === selectedSatellite.id;
            const related =
              selectedSatellite &&
              collisionPairs.some(
                (pair) =>
                  (pair.from.id === selectedSatellite.id && pair.to.id === satellite.id) ||
                  (pair.to.id === selectedSatellite.id && pair.from.id === satellite.id)
              );
            const mediumRisk = (satellite.congestion_class ?? 0) === 1;
            const majorThreat = satellite.riskScore > 0.92;
            const active = satellite.id === selectedSatellite?.id;
            const priority = getPriority(satellite, collisionIds.has(satellite.id), focused, related);
            const showOrbit = active || majorThreat || related || (mediumRisk && !selectedSatellite);

            return (
              <group key={satellite.id}>
                {showOrbit && (
                  <OrbitPath
                    points={satellite.orbitPath}
                    riskLevel={majorThreat ? "danger" : mediumRisk ? "medium" : "safe"}
                    active={active}
                    related={Boolean(related)}
                    dimmed={Boolean(selectedSatellite) && !focused && !related}
                  />
                )}
                <SatelliteMesh
                  index={index}
                  satellite={satellite}
                  active={active}
                  priority={priority}
                  onSelect={onSelect}
                />
              </group>
            );
          })}

          {collisionPairs.map((pair) => (
            <CollisionPrediction key={pair.id} pair={pair} selectedId={selectedSatellite?.id} />
          ))}
        </CinematicOrbitField>

        <OrbitControls
          enablePan
          minDistance={6}
          maxDistance={60}
          autoRotate={!selectedSatellite}
          autoRotateSpeed={0.12}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>

      <SceneHud
        selectedSatellite={selectedSatellite}
        heatZones={heatZones}
        collisionPairs={collisionPairs}
      />
      <TelemetryOverlay
        selectedSatellite={selectedSatellite}
        heatZones={heatZones}
        collisionPairs={collisionPairs}
      />
    </div>
  );
}

function CameraDrift() {
  useFrame(({ camera, clock }) => {
    camera.position.x += Math.sin(clock.elapsedTime * 0.18) * 0.0009;
    camera.position.y += Math.cos(clock.elapsedTime * 0.14) * 0.0007;
  });
  return null;
}

function CinematicOrbitField({ children }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.006;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.00008) * 0.015;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function Earth() {
  const meshRef = useRef();
  const cloudsRef = useRef();
  const atmosphereRef = useRef();
  const [surfaceMap, bumpMap, specularMap, cloudMap] = useTexture([
    `${TEXTURE_BASE_URL}/ColorMap.jpg`,
    `${TEXTURE_BASE_URL}/Bump.jpg`,
    `${TEXTURE_BASE_URL}/SpecMask.jpg`,
    `${TEXTURE_BASE_URL}/alphaMap.jpg`
  ]);

  useMemo(() => {
    [surfaceMap, bumpMap, specularMap, cloudMap].forEach((texture, index) => {
      if (!texture) {
        return;
      }
      if (index === 0) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = 8;
    });
  }, [surfaceMap, bumpMap, specularMap, cloudMap]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.018;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.095;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * 0.014;
    }
  });

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(23.5)]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial
          map={surfaceMap}
          bumpMap={bumpMap}
          bumpScale={0.22}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={20}
        />
      </mesh>
      <mesh ref={cloudsRef} scale={1.018}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial
          alphaMap={cloudMap}
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={atmosphereRef} scale={1.1}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <EarthAtmosphereMaterial />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#00a6ff"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function EarthAtmosphereMaterial() {
  return (
    <shaderMaterial
      blending={THREE.AdditiveBlending}
      side={THREE.BackSide}
      transparent
      vertexShader={`
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.18, 0.56, 1.0, 1.0) * intensity;
        }
      `}
    />
  );
}

function OrbitalLayers() {
  return (
    <group>
      {LAYER_DEFS.map((layer, index) => (
        <group key={layer.name}>
          <mesh>
            <sphereGeometry args={[layer.radius, 96, 96]} />
            <meshBasicMaterial
              color={layer.color}
              transparent
              opacity={layer.opacity}
              wireframe
              depthWrite={false}
            />
          </mesh>
          <LayerBand radius={layer.radius} color={layer.color} index={index} />
          <Html position={[layer.radius + 0.5, 0.25 + index * 0.3, 0]} distanceFactor={20}>
            <span className="rounded border border-white/5 bg-slate-950/35 px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-slate-300/60 backdrop-blur">
              {layer.name}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

function LayerBand({ radius, color, index }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * (0.025 + index * 0.008);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0.2 * index, 0.35 * index]}>
      <torusGeometry args={[radius, 0.012, 10, 160]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.12 - index * 0.025}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function CongestionHeatmap({ zones }) {
  return (
    <group>
      {zones.map((zone) => (
        <HeatZone key={zone.id} zone={zone} />
      ))}
    </group>
  );
}

function HeatZone({ zone }) {
  const groupRef = useRef();
  const heatRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6 + zone.phase) * 0.08;
    groupRef.current.scale.setScalar(pulse);
    groupRef.current.rotation.y += 0.0015 * zone.intensity;
    if (heatRef.current?.material) {
      heatRef.current.material.opacity =
        zone.opacity + Math.sin(state.clock.elapsedTime * 1.15 + zone.phase) * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={zone.position}>
      <mesh ref={heatRef}>
        <sphereGeometry args={[zone.radius, 32, 32]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={zone.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, zone.phase]}>
        <torusGeometry args={[zone.radius * 0.86, 0.035, 12, 96]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={zone.opacity * 1.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function OrbitPath({ points, riskLevel, active, related, dimmed }) {
  const linePoints = useMemo(
    () => orbitPathPoints(points).map((point) => new THREE.Vector3(...point)),
    [points]
  );
  const color = active
    ? "#f8fafc"
    : riskLevel === "danger"
      ? "#ff2f2f"
      : riskLevel === "medium"
        ? "#f59e0b"
        : "#7dd3fc";
  const opacity = dimmed
    ? 0.025
    : active
      ? 0.92
      : related
        ? 0.22
        : riskLevel === "danger"
          ? 0.10
          : riskLevel === "medium"
            ? 0.16
            : 0.08;

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={active ? 2 : riskLevel === "danger" ? 0.75 : riskLevel === "medium" ? 0.7 : 0.35}
      transparent
      opacity={opacity}
    />
  );
}

function SatelliteMesh({ index, satellite, active, priority, onSelect }) {
  const groupRef = useRef();
  const pulseRef = useRef();

  const targetVector = useRef(
    new THREE.Vector3(...satellite.positionVector)
  );

  const initialVector = useMemo(
    () => new THREE.Vector3(...satellite.positionVector),
    [satellite.positionVector]
  );

  const orbitRadius = useRef(
    Math.sqrt(initialVector.x ** 2 + initialVector.z ** 2)
  );

  const orbitHeight = useRef(initialVector.y);

  const orbitAngle = useRef(
    Math.atan2(initialVector.z, initialVector.x)
  );

  const orbitSpeed = useRef(getOrbitSpeed(satellite));

  const dimmed = priority === "dimmed";

  const satelliteSize = getSatelliteSize(satellite);

  const showLabel =
    active ||
    satellite.orbitType === "GEO" ||
    satellite.orbitType === "MEO" ||
    satellite.riskScore > 0.7 ||
    (satellite.congestion_class ?? 0) >= 1 ||
    index % 12 === 0;

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    orbitAngle.current += delta * orbitSpeed.current;

    targetVector.current.set(
      orbitRadius.current * Math.cos(orbitAngle.current),

      orbitHeight.current +
        Math.sin(
          orbitAngle.current * 0.65 + satellite.riskScore
        ) * 0.16,

      orbitRadius.current * Math.sin(orbitAngle.current)
    );

    groupRef.current.position.lerp(
      targetVector.current,
      0.08
    );

    groupRef.current.scale.setScalar(
      (
        active
          ? 1.5
          : satellite.isDanger
            ? 1.32
            : 0.92
      ) * satelliteSize
    );

    groupRef.current.lookAt(0, 0, 0);

    groupRef.current.rotateY(Math.PI / 2);

    groupRef.current.rotateZ(
      Math.sin(state.clock.elapsedTime * 0.65) * 0.18
    );

    if (pulseRef.current) {
      const pulse =
        1 +
        Math.sin(
          state.clock.elapsedTime * 2.4 +
          satellite.riskScore * 3
        ) * 0.16;

      pulseRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={satellite.positionVector}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(satellite.id);
      }}
    >
      <Trail
        width={
          satellite.isDanger
            ? 1.2
            : satellite.orbitType === "GEO"
              ? 1
              : 0.7
        }
        length={satellite.isDanger ? 5 : 3.5}
        color={
          satellite.isDanger
            ? "#cc3333"
            : satellite.orbitType === "MEO"
              ? "#f59e0b"
              : "#22d3ee"
        }
        attenuation={(trailWidth) => trailWidth}
      >
        <SatelliteModel
          danger={satellite.isDanger}
          active={active}
          dimmed={dimmed}
        />
      </Trail>

      {(satellite.isDanger || active) && (
        <mesh ref={pulseRef}>
          <sphereGeometry
            args={[
              satellite.isDanger ? 0.72 : 0.52,
              24,
              24
            ]}
          />

          <meshBasicMaterial
            color={
              satellite.isDanger
                ? "#aa3333"
                : "#67e8f9"
            }
            transparent
            opacity={
              dimmed
                ? 0.02
                : satellite.isDanger
                  ? 0.18
                  : 0.1
            }
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {(active || satellite.isDanger) && (
        <CyberPulse
          danger={satellite.isDanger}
          dimmed={dimmed}
        />
      )}

      {showLabel && (
        <Html
          position={[0, 0.42, 0]}
          distanceFactor={6}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(satellite.id);
            }}
            className={`rounded border px-2 py-1 text-[16px] font-semibold tracking-wide backdrop-blur transition ${
              active
                ? "border-white/80 bg-white/20 text-white"

                : satellite.isDanger
                  ? "border-red-400/70 bg-red-950/85 text-red-100"

                  : (satellite.congestion_class ?? 0) >= 1
                    ? "border-amber-300/60 bg-amber-950/75 text-amber-100"

                    : "border-cyan-400/40 bg-slate-950/95 text-white"
            } ${
              dimmed
                ? "opacity-60"
                : "opacity-100"
            }`}
          >
            {satellite.name}
          </button>
        </Html>
      )}
    </group>
  );
}

function CyberPulse({ danger, dimmed }) {
  const ringRef = useRef();

  useFrame((state) => {
    if (!ringRef.current) {
      return;
    }
    ringRef.current.rotation.z += danger ? 0.038 : 0.02;
    ringRef.current.scale.setScalar(1 + (state.clock.elapsedTime % 1.5) * (danger ? 0.28 : 0.16));
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.4, 0.01, 8, 48]} />
      <meshBasicMaterial
        color={danger ? "#ff3131" : "#00e5ff"}
        transparent
        opacity={dimmed ? 0.025 : danger ? 0.68 : 0.42}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function SatelliteModel({ danger, active, dimmed }) {
  const bodyColor = active ? "#f8fafc" : danger ? "#ff6666" : "#dbeafe";
  const panelColor = danger ? "#cc3333" : "#2563eb";
  const beaconColor = danger ? "#ff4444" : "#22d3ee";

  const opacity = dimmed ? 0.72 : 1;

  return (
    <group scale={1.06}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[0.24, 0.18, 0.34]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={danger ? "#661111" : "#1e293b"}
          emissiveIntensity={danger ? 0.9 : 0.25}
          metalness={0.55}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Right solar panel */}
      <mesh position={[0.42, 0, 0]}>
        <boxGeometry args={[0.5, 0.018, 0.24]} />
        <meshStandardMaterial
          color={panelColor}
          emissive={danger ? "#551111" : "#1e3a8a"}
          emissiveIntensity={danger ? 0.7 : 0.18}
          metalness={0.8}
          roughness={0.25}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Left solar panel */}
      <mesh position={[-0.42, 0, 0]}>
        <boxGeometry args={[0.5, 0.018, 0.24]} />
        <meshStandardMaterial
          color={panelColor}
          emissive={danger ? "#551111" : "#1e3a8a"}
          emissiveIntensity={danger ? 0.7 : 0.18}
          metalness={0.8}
          roughness={0.25}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Beacon light */}
      <mesh position={[0, 0.26, -0.05]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color={beaconColor}
          emissive={beaconColor}
          emissiveIntensity={danger ? 1.5 : 0.6}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Front antenna */}
      <mesh position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.16, 18, 1, true]} />
        <meshStandardMaterial
          color="#d5dbe2"
          emissive="#111827"
          emissiveIntensity={0.08}
          metalness={0.88}
          roughness={0.22}
          side={THREE.DoubleSide}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
function CollisionPrediction({ pair, selectedId }) {
  const lineRef = useRef();
  const from = new THREE.Vector3(...pair.from.positionVector);
  const to = new THREE.Vector3(...pair.to.positionVector);
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  const highlighted = !selectedId || pair.from.id === selectedId || pair.to.id === selectedId;
  const countdown = Math.max(1, Math.round((pair.distanceKm ?? 0) / 120));

  useFrame(({ clock }) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = highlighted
        ? 0.56 + Math.sin(clock.elapsedTime * 4) * 0.22
        : 0.13;
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={[from, midpoint.clone().multiplyScalar(1.08), to]}
        color="#ff3b3b"
        lineWidth={highlighted ? 3.1 : 1}
        transparent
        opacity={highlighted ? 0.72 : 0.13}
      />
      {highlighted && (
        <group position={midpoint.toArray()}>
          <mesh>
            <sphereGeometry args={[0.7, 28, 28]} />
            <meshBasicMaterial
              color="#ff3b3b"
              transparent
              opacity={0.24}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <Html position={[0, 0.7, 0]} distanceFactor={22}>
            <div className="rounded border border-red-400/40 bg-red-950/65 px-2 py-1 text-[9px] font-semibold text-red-100 backdrop-blur">
              T-{countdown}s CA
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function SceneHud({ selectedSatellite, heatZones, collisionPairs }) {
  const topZone = heatZones[0];
  const nearbyThreats = selectedSatellite
    ? collisionPairs.filter(
        (pair) => pair.from.id === selectedSatellite.id || pair.to.id === selectedSatellite.id
      ).length
    : 0;

  return (
    <div className="pointer-events-none absolute left-4 top-4 grid max-w-[300px] gap-3">
      <div className="rounded-lg border border-red-400/20 bg-slate-950/45 p-3 shadow-[0_0_28px_rgba(239,68,68,0.18)] backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.28em] text-red-200/80">
          Orbital Crisis Feed
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {topZone ? "LEO congestion spike detected" : "Monitoring orbital density"}
        </p>
        <p className="mt-1 text-xs text-slate-300">
          {collisionPairs.length > 0
            ? `${collisionPairs.length} close approach warnings active`
            : "No active close approach warnings"}
        </p>
      </div>

      {selectedSatellite && (
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-950/30 p-3 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">
            Focus Mode
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{selectedSatellite.name}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <span>Threats: {nearbyThreats}</span>
            <span>Risk: {Math.round(selectedSatellite.riskScore * 100)}%</span>
            <span>Class: {selectedSatellite.congestion_class ?? 0}</span>
            <span>Density: {selectedSatellite.local_density ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryOverlay({ selectedSatellite, heatZones, collisionPairs }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 w-[270px] text-cyan-100/80">
      <div className="orbital-radar relative h-36 overflow-hidden rounded-lg border border-cyan-300/10 bg-cyan-950/5">
        <div className="radar-sweep" />
        <div className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.24em] text-cyan-200/70">
          Scan Net
        </div>
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2 text-[10px]">
          <span>
            Heat
            <strong>{heatZones.length}</strong>
          </span>
          <span>
            CA
            <strong>{collisionPairs.length}</strong>
          </span>
          <span>
            Lock
            <strong>{selectedSatellite ? "ON" : "ARM"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function buildHeatZones(satellites) {
  return satellites
    .filter((satellite) => (satellite.congestion_class ?? 0) >= 2 || satellite.riskScore > 0.88)
    .sort((left, right) => {
      const rightScore = (right.local_density ?? 0) + (right.riskScore ?? 0) * 10;
      const leftScore = (left.local_density ?? 0) + (left.riskScore ?? 0) * 10;
      return rightScore - leftScore;
    })
    .slice(0, 7)
    .map((satellite, index) => {
      const intensity = Math.max(1, satellite.congestion_class ?? 1);
      const isCritical = intensity >= 2 || satellite.isDanger;
      return {
        id: satellite.id,
        position: satellite.positionVector,
        radius: 0.9 + intensity * 0.32 + Math.min(satellite.local_density ?? 0, 8) * 0.04,
        opacity: isCritical ? 0.08 : 0.045,
        color: isCritical ? "#aa3333" : "#c0841a",
        intensity,
        phase: index * 0.85
      };
    });
}

function getPriority(satellite, inCollisionPair, focused, related) {
  if (!focused && !related) {
    return "dimmed";
  }
  if (satellite.isDanger || inCollisionPair || related) {
    return "danger";
  }
  return "normal";
}

function getSatelliteSize(satellite) {
  if (satellite.orbitType === "GEO") {
    return 2.6;
  }
  if (satellite.orbitType === "MEO") {
    return 2.0;
  }
  return 1;
}

function getOrbitSpeed(satellite) {
  if (satellite.orbitType === "GEO") {
    return 0.012;
  }

  if (satellite.orbitType === "MEO") {
    return 0.035;
  }

  return 0.085;
}
