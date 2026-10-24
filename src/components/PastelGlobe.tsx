import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { siteConfig } from '../config/siteConfig';
import {
  HOLLAND_BORDER,
  WORLD_COASTLINE_RINGS,
  WORLD_LAND_TILES,
} from '../data/worldMapData';

/**
 * Converts geographic (lat, lon) in degrees to 3D Cartesian coordinates on a sphere.
 * Prime Meridian (lon = 0) faces +Z (towards the camera), East (+lon) is +X, North (+lat) is +Y.
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return new THREE.Vector3(x, y, z);
}

export const PastelGlobe: React.FC<{ visible: boolean }> = ({ visible }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Position camera looking cleanly at the Northern/European hemisphere
    camera.position.set(0, 0.4, 9.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 2.95;
    const primaryColor = new THREE.Color(siteConfig.colors.primaryPastelRed);
    const secondaryColor = new THREE.Color(siteConfig.colors.secondaryPastelRed);

    // 1. Dark ocean sphere (occludes back-hemisphere continents so front map is crystal clear)
    const coreGeo = new THREE.SphereGeometry(radius * 0.992, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#141519'),
      transparent: true,
      opacity: 0.96,
    });
    globeGroup.add(new THREE.Mesh(coreGeo, coreMat));

    // 2. Subtle ocean graticule (latitude & longitude lines every 30 deg)
    const graticuleMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.11,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        pts.push(latLonToVector3(lat, lon, radius * 0.996));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, graticuleMat));
    }

    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -80; lat <= 80; lat += 5) {
        pts.push(latLonToVector3(lat, lon, radius * 0.996));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, graticuleMat));
    }

    // 3. World Continent Land Tiles (from ottomated.net/grid.js)
    const landPositions = new Float32Array(WORLD_LAND_TILES.length * 3);
    for (let i = 0; i < WORLD_LAND_TILES.length; i++) {
      const [lat, lon] = WORLD_LAND_TILES[i];
      const v = latLonToVector3(lat, lon, radius * 1.002);
      landPositions[i * 3] = v.x;
      landPositions[i * 3 + 1] = v.y;
      landPositions[i * 3 + 2] = v.z;
    }
    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute('position', new THREE.BufferAttribute(landPositions, 3));
    const landMat = new THREE.PointsMaterial({
      color: secondaryColor,
      size: 0.055,
      transparent: true,
      opacity: 0.72,
    });
    globeGroup.add(new THREE.Points(landGeo, landMat));

    // 4. Crisp World Continent Coastline Outlines (Natural Earth)
    const coastMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.82,
    });

    WORLD_COASTLINE_RINGS.forEach((ring) => {
      const pts = ring.map(([lat, lon]) => latLonToVector3(lat, lon, radius * 1.005));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, coastMat));
    });

    // 5. Highlighted Holland (Netherlands) Border Outline
    const hollandBorderPts = HOLLAND_BORDER.map(([lat, lon]) =>
      latLonToVector3(lat, lon, radius * 1.012)
    );
    const hollandBorderGeo = new THREE.BufferGeometry().setFromPoints(hollandBorderPts);
    const hollandBorderMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#FFAFB0'),
      transparent: true,
      opacity: 1,
    });
    globeGroup.add(new THREE.LineLoop(hollandBorderGeo, hollandBorderMat));

    // 6. Holland Location Pin (52.37°N, 4.90°E)
    const hollandLat = siteConfig.location.lat;
    const hollandLon = siteConfig.location.lon;
    const hollandSurface = latLonToVector3(hollandLat, hollandLon, radius * 1.01);
    const hollandPinTip = latLonToVector3(hollandLat, hollandLon, radius + 0.48);

    // Pin stem
    const pinStemGeo = new THREE.BufferGeometry().setFromPoints([
      hollandSurface,
      hollandPinTip,
    ]);
    const pinStemMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 1,
    });
    globeGroup.add(new THREE.Line(pinStemGeo, pinStemMat));

    // Glowing pin head sphere
    const pinHeadGeo = new THREE.SphereGeometry(0.085, 24, 24);
    const pinHeadMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
    });
    const pinHeadMesh = new THREE.Mesh(pinHeadGeo, pinHeadMat);
    pinHeadMesh.position.copy(hollandPinTip);
    globeGroup.add(pinHeadMesh);

    // Pin surface anchor dot
    const surfaceDotGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const surfaceDotMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFFFFF'),
    });
    const surfaceDotMesh = new THREE.Mesh(surfaceDotGeo, surfaceDotMat);
    surfaceDotMesh.position.copy(hollandSurface);
    globeGroup.add(surfaceDotMesh);

    // Expanding radar pulse ring on Holland
    const pulseGeo = new THREE.RingGeometry(0.06, 0.11, 36);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.position.copy(latLonToVector3(hollandLat, hollandLon, radius * 1.015));
    pulseMesh.lookAt(latLonToVector3(hollandLat, hollandLon, radius * 2));
    globeGroup.add(pulseMesh);

    // 7. Connection arcs from Holland to visited/selected countries
    const destinations = [
      { name: 'Tanzania', lat: -6.36, lon: 34.88 },
      { name: 'Norway', lat: 61.5, lon: 8.5 },
      { name: 'Greenland', lat: 66.0, lon: -44.0 },
      { name: 'Germany', lat: 51.16, lon: 10.45 },
      { name: 'Austria', lat: 47.51, lon: 14.55 },
      { name: 'Slovenia', lat: 46.15, lon: 14.99 },
      { name: 'France', lat: 46.6, lon: 2.21 },
      { name: 'Ireland', lat: 53.35, lon: -7.8 },
    ];

    const destDotGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const destDotMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.9,
    });

    destinations.forEach((dest) => {
      const start = hollandSurface;
      const end = latLonToVector3(dest.lat, dest.lon, radius * 1.008);
      const dist = start.distanceTo(end);
      // Scale arc elevation smoothly with distance so nearby European countries have graceful low arcs
      const arcBoost = Math.max(0.14, Math.min(0.75, dist * 0.34));
      const mid = start
        .clone()
        .add(end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(radius + arcBoost);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
      const arcMat = new THREE.LineBasicMaterial({
        color: secondaryColor,
        transparent: true,
        opacity: 0.62,
      });
      globeGroup.add(new THREE.Line(arcGeo, arcMat));

      const destDot = new THREE.Mesh(destDotGeo, destDotMat);
      destDot.position.copy(end);
      globeGroup.add(destDot);
    });

    // 8. Outer atmosphere ring
    const haloCurve = new THREE.EllipseCurve(
      0,
      0,
      radius * 1.06,
      radius * 1.06,
      0,
      2 * Math.PI,
      false,
      0
    );
    const haloPts = haloCurve.getPoints(128).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const haloGeo = new THREE.BufferGeometry().setFromPoints(haloPts);
    const haloMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.22,
    });
    scene.add(new THREE.LineLoop(haloGeo, haloMat));

    // Orient globe so Europe & Holland (52.37°N, 4.90°E) face directly towards the viewer
    const baseRotY = -(hollandLon * Math.PI) / 180;
    const baseRotX = ((hollandLat - 14) * Math.PI) / 180; // Tilt North hemisphere toward camera
    globeGroup.rotation.y = baseRotY;
    globeGroup.rotation.x = baseRotX;

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let userOffsetY = 0;
    let userOffsetX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      userOffsetY += dx * 0.0055;
      userOffsetX = Math.max(-0.7, Math.min(0.7, userOffsetX + dy * 0.0055));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let frameId = 0;
    let clock = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      clock += 0.025;

      if (!isDragging) {
        // Smoothly ease user drag back toward Europe/Holland and gently oscillate
        userOffsetY *= 0.985;
        userOffsetX *= 0.985;
      }

      const gentleSwayY = Math.sin(clock * 0.45) * 0.22;
      const gentleSwayX = Math.cos(clock * 0.3) * 0.05;

      globeGroup.rotation.y = baseRotY + gentleSwayY + userOffsetY;
      globeGroup.rotation.x = baseRotX + gentleSwayX + userOffsetX;

      // Pulse animation on the Holland marker
      const pulseScale = 1 + (Math.sin(clock * 1.4) * 0.5 + 0.5) * 2.1;
      pulseMesh.scale.set(pulseScale, pulseScale, 1);
      pulseMat.opacity = 0.9 * (1 - (pulseScale - 1) / 2.3);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || 480;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`globe-wrapper ${visible ? 'globe-visible' : ''}`}
      aria-label="Interactive 3D world map centered on Holland"
    >
      <div ref={containerRef} className="globe-canvas-container" />
    </div>
  );
};
