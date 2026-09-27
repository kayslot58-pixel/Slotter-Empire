const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.getElementById('miniMap');
const mmCtx = miniMap.getContext('2d');

const cashValue = document.getElementById('cashValue');
const wantedValue = document.getElementById('wantedValue');
const healthValue = document.getElementById('healthValue');
const districtValue = document.getElementById('districtValue');
const missionText = document.getElementById('missionText');

const WORLD = { width: 2600, height: 1800 };
const keys = {};
const buildings = [];
const npcs = [];
const police = [];
const vehicles = [];
const districts = [
  { name: 'Johannesburg CBD', x: 700, y: 240, w: 760, h: 460 },
  { name: 'Hillbrow', x: 1620, y: 240, w: 560, h: 340 },
  { name: 'Soweto', x: 640, y: 920, w: 760, h: 520 },
  { name: 'Cape Town Strip', x: 1500, y: 1020, w: 720, h: 420 },
  { name: 'Durban Bay', x: 1030, y: 1460, w: 880, h: 220 },
];

const missionTemplates = [
  {
    id: 'pickup',
    title: 'Collect the package from Hillbrow',
    description: 'Meet the courier in Hillbrow and grab the stolen goods.',
    target: { x: 1800, y: 500 },
    radius: 70,
    reward: 2500,
    completed: false,
  },
  {
    id: 'drive',
    title: 'Drive the goods to Soweto',
    description: 'Take the package through the city and deliver it safely.',
    target: { x: 950, y: 1150 },
    radius: 100,
    reward: 4100,
    completed: false,
  },
  {
    id: 'escape',
    title: 'Shake the police in Durban Bay',
    description: 'Lose the cops, then hide in the bay area.',
    target: { x: 1420, y: 1570 },
    radius: 120,
    reward: 6500,
    completed: false,
  },
];

let player = {
  x: 1100,
  y: 700,
  radius: 18,
  vx: 0,
  vy: 0,
  speed: 0,
  angle: 0,
  inVehicle: false,
  cash: 2500,
  wanted: 0,
  health: 100,
  district: 'Johannesburg CBD',
  currentMission: 0,
  missionProgress: 0,
  lastShot: 0,
};

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCurrentDistrict(x, y) {
  return districts.find((region) => x > region.x && x < region.x + region.w && y > region.y && y < region.y + region.h) || { name: 'Open Roads' };
}

function setupBuildings() {
  const blockList = [
    { x: 840, y: 300, w: 180, h: 120 },
    { x: 1030, y: 330, w: 220, h: 140 },
    { x: 1360, y: 330, w: 210, h: 120 },
    { x: 840, y: 540, w: 180, h: 110 },
    { x: 1180, y: 540, w: 220, h: 110 },
    { x: 1680, y: 360, w: 160, h: 160 },
    { x: 1810, y: 650, w: 220, h: 140 },
    { x: 780, y: 1010, w: 260, h: 130 },
    { x: 1100, y: 1010, w: 190, h: 130 },
    { x: 1480, y: 1170, w: 180, h: 140 },
    { x: 1750, y: 1180, w: 220, h: 140 },
    { x: 1220, y: 1560, w: 180, h: 120 },
    { x: 1550, y: 1540, w: 230, h: 130 },
  ];

  buildings.push(...blockList);
}

function setupNPCs() {
  for (let i = 0; i < 26; i += 1) {
    npcs.push({
      x: 250 + Math.random() * 2100,
      y: 180 + Math.random() * 1450,
      radius: 10,
      color: i % 3 === 0 ? '#d9c1ff' : i % 2 === 0 ? '#f9d67c' : '#7fd7d8',
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      mood: ['walking', 'chatting', 'loitering'][Math.floor(Math.random() * 3)],
    });
  }
}

function setupPolice() {
  police.push({ x: 2240, y: 550, radius: 16, color: '#f96b6b', hp: 100, chasing: false });
  police.push({ x: 2400, y: 1500, radius: 16, color: '#f96b6b', hp: 100, chasing: false });
  police.push({ x: 500, y: 1100, radius: 16, color: '#f96b6b', hp: 100, chasing: false });
}

function setupVehicles() {
  const coords = [
    { x: 1025, y: 650 },
    { x: 1280, y: 600 },
    { x: 1100, y: 1350 },
    { x: 1650, y: 1120 },
    { x: 1950, y: 500 },
    { x: 720, y: 1260 },
  ];

  coords.forEach((pos, index) => {
    vehicles.push({
      x: pos.x,
      y: pos.y,
      w: 36,
      h: 18,
      color: ['#ff6b35', '#7ad0ff', '#dbca6d', '#ef58b4', '#88d98a', '#a0b5ff'][index],
      angle: 0,
      occupied: false,
      name: ['Bakkie', 'Rider', 'Courier', 'Taxi', 'Beast', 'Jetta'][index],
    });
  });
}

function updateHUD() {
  cashValue.textContent = `R ${player.cash.toLocaleString()}`;
  wantedValue.textContent = `${player.wanted}★`;
  healthValue.textContent = `${Math.round(player.health)}%`;
  districtValue.textContent = player.district;

  const activeMission = missionTemplates[player.currentMission];
  if (activeMission) {
    missionText.textContent = `${activeMission.title} – ${activeMission.description}`;
  }
}

function updatePlayer(dt) {
  const accel = player.inVehicle ? 280 : 180;
  const friction = player.inVehicle ? 0.92 : 0.86;
  let moveX = 0;
  let moveY = 0;

  if (keys['w'] || keys['arrowup']) moveY -= 1;
  if (keys['s'] || keys['arrowdown']) moveY += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    player.angle = Math.atan2(moveY, moveX);
    const boostFactor = keys.shift ? 1.5 : 1;
    player.vx += (moveX / length) * accel * boostFactor * dt;
    player.vy += (moveY / length) * accel * boostFactor * dt;
  }

  const maxSpeed = player.inVehicle ? 350 : 170;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    player.vx *= scale;
    player.vy *= scale;
  }

  player.vx *= friction;
  player.vy *= friction;

  if (Math.abs(player.vx) < 0.05) player.vx = 0;
  if (Math.abs(player.vy) < 0.05) player.vy = 0;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.inVehicle) {
    const vehicle = getNearestVehicle();
    if (vehicle) {
      vehicle.x = player.x - Math.cos(player.angle) * 24;
      vehicle.y = player.y - Math.sin(player.angle) * 24;
      vehicle.angle = player.angle;
    }
  }

  player.x = clamp(player.x, player.radius, WORLD.width - player.radius);
  player.y = clamp(player.y, player.radius, WORLD.height - player.radius);

  player.district = getCurrentDistrict(player.x, player.y).name;

  if (player.inVehicle) {
    player.health = clamp(player.health + 1 * dt, 0, 100);
  }

  player.wanted = clamp(player.wanted - 0.6 * dt, 0, 5);
  if (player.wanted > 0 && Math.random() < 0.008) {
    player.health = clamp(player.health - 2, 0, 100);
  }
}

function getNearestVehicle() {
  let nearest = null;
  let minDistance = Infinity;

  vehicles.forEach((vehicle) => {
    const distance = dist(player, vehicle);
    if (distance < minDistance) {
      nearest = vehicle;
      minDistance = distance;
    }
  });

  return nearest;
}

function handleInteraction() {
  if (player.inVehicle) {
    player.inVehicle = false;
    player.x += Math.cos(player.angle) * 32;
    player.y += Math.sin(player.angle) * 32;
    return;
  }

  const closestVehicle = getNearestVehicle();
  if (closestVehicle && dist(player, closestVehicle) < 50) {
    player.inVehicle = true;
    player.x = closestVehicle.x;
    player.y = closestVehicle.y;
    return;
  }

  const mission = missionTemplates[player.currentMission];
  if (!mission) return;

  if (dist(player, mission.target) < mission.radius) {
    mission.completed = true;
    player.cash += mission.reward;
    player.wanted = clamp(player.wanted + 1, 0, 5);
    player.currentMission += 1;
    if (!missionTemplates[player.currentMission]) {
      player.currentMission = missionTemplates.length - 1;
    }
  }
}

function updateNPCs(dt) {
  npcs.forEach((npc) => {
    npc.x += npc.vx * 120 * dt;
    npc.y += npc.vy * 120 * dt;

    if (npc.x < 120 || npc.x > WORLD.width - 120) npc.vx *= -1;
    if (npc.y < 120 || npc.y > WORLD.height - 120) npc.vy *= -1;

    if (dist(player, npc) < 28 && player.wanted > 0) {
      player.cash = Math.max(0, player.cash - 50);
      player.wanted = clamp(player.wanted + 0.3, 0, 5);
    }
  });
}

function updatePolice(dt) {
  police.forEach((cop) => {
    const distToPlayer = dist(player, cop);
    if (player.wanted > 0.5) {
      cop.chasing = true;
      const dx = player.x - cop.x;
      const dy = player.y - cop.y;
      const angle = Math.atan2(dy, dx);
      cop.x += Math.cos(angle) * 120 * dt;
      cop.y += Math.sin(angle) * 120 * dt;

      if (distToPlayer < 42) {
        player.health -= 18 * dt;
      }
    } else {
      cop.chasing = false;
    }
  });
}

function drawBackground() {
  ctx.fillStyle = '#29483e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#3b5d56';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  districts.forEach((district) => {
    const sx = district.x - player.x + canvas.width / 2;
    const sy = district.y - player.y + canvas.height / 2;
    ctx.fillStyle = district.name === player.district ? 'rgba(108, 196, 123, 0.18)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(sx, sy, district.w, district.h);
    ctx.fillStyle = '#dfece4';
    ctx.font = '16px sans-serif';
    ctx.fillText(district.name, sx + 20, sy + 28);
  });

  ctx.strokeStyle = '#1a1f22';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(300 - player.x + canvas.width / 2, 240 - player.y + canvas.height / 2);
  ctx.lineTo(1800 - player.x + canvas.width / 2, 240 - player.y + canvas.height / 2);
  ctx.moveTo(700 - player.x + canvas.width / 2, 660 - player.y + canvas.height / 2);
  ctx.lineTo(990 - player.x + canvas.width / 2, 1100 - player.y + canvas.height / 2);
  ctx.moveTo(1360 - player.x + canvas.width / 2, 1100 - player.y + canvas.height / 2);
  ctx.lineTo(2080 - player.x + canvas.width / 2, 1250 - player.y + canvas.height / 2);
  ctx.moveTo(1080 - player.x + canvas.width / 2, 1460 - player.y + canvas.height / 2);
  ctx.lineTo(1620 - player.x + canvas.width / 2, 1460 - player.y + canvas.height / 2);
  ctx.stroke();

  buildings.forEach((building) => {
    const bx = building.x - player.x + canvas.width / 2;
    const by = building.y - player.y + canvas.height / 2;
    ctx.fillStyle = '#40575d';
    ctx.fillRect(bx, by, building.w, building.h);
    ctx.strokeStyle = '#233a3d';
    ctx.strokeRect(bx, by, building.w, building.h);
  });

  vehicles.forEach((vehicle) => {
    const vx = vehicle.x - player.x + canvas.width / 2;
    const vy = vehicle.y - player.y + canvas.height / 2;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(vehicle.angle);
    ctx.fillStyle = vehicle.color;
    ctx.fillRect(-18, -10, 36, 20);
    ctx.fillStyle = '#101b1f';
    ctx.fillRect(-10, -7, 20, 14);
    ctx.restore();
  });

  npcs.forEach((npc) => {
    const nx = npc.x - player.x + canvas.width / 2;
    const ny = npc.y - player.y + canvas.height / 2;
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(nx, ny, npc.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  police.forEach((cop) => {
    const px = cop.x - player.x + canvas.width / 2;
    const py = cop.y - player.y + canvas.height / 2;
    ctx.fillStyle = cop.chasing ? '#ff3b3b' : '#ffb3a7';
    ctx.beginPath();
    ctx.arc(px, py, cop.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const mission = missionTemplates[player.currentMission];
  if (mission) {
    const mx = mission.target.x - player.x + canvas.width / 2;
    const my = mission.target.y - player.y + canvas.height / 2;
    ctx.strokeStyle = '#7ffa95';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, mission.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7ffa95';
    ctx.fillRect(mx - 4, my - 4, 8, 8);
  }

  const px = canvas.width / 2;
  const py = canvas.height / 2;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.inVehicle ? '#ffd166' : '#d7f9ff';
  ctx.fillRect(0, -8, 24, 16);
  ctx.fillStyle = '#0e1d21';
  ctx.fillRect(-10, -4, 14, 8);
  ctx.restore();

  if (player.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('You were busted', canvas.width / 2, canvas.height / 2);
    player.health = 100;
    player.x = 1100;
    player.y = 700;
    player.wanted = 0;
    player.cash = Math.max(0, player.cash - 500);
  }
}

function drawMiniMap() {
  mmCtx.clearRect(0, 0, miniMap.width, miniMap.height);
  mmCtx.fillStyle = '#0d1d21';
  mmCtx.fillRect(0, 0, miniMap.width, miniMap.height);

  mmCtx.fillStyle = '#2d463f';
  mmCtx.fillRect(0, 0, miniMap.width, miniMap.height);

  districts.forEach((district) => {
    const dx = (district.x / WORLD.width) * miniMap.width;
    const dy = (district.y / WORLD.height) * miniMap.height;
    const dw = (district.w / WORLD.width) * miniMap.width;
    const dh = (district.h / WORLD.height) * miniMap.height;
    mmCtx.fillStyle = '#3d6358';
    mmCtx.fillRect(dx, dy, dw, dh);
  });

  const px = (player.x / WORLD.width) * miniMap.width;
  const py = (player.y / WORLD.height) * miniMap.height;
  mmCtx.fillStyle = '#edff8f';
  mmCtx.beginPath();
  mmCtx.arc(px, py, 5, 0, Math.PI * 2);
  mmCtx.fill();

  const mission = missionTemplates[player.currentMission];
  if (mission) {
    const mx = (mission.target.x / WORLD.width) * miniMap.width;
    const my = (mission.target.y / WORLD.height) * miniMap.height;
    mmCtx.fillStyle = '#7ffa95';
    mmCtx.fillRect(mx - 3, my - 3, 6, 6);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.032);
  last = now;

  updatePlayer(dt);
  updateNPCs(dt);
  updatePolice(dt);
  drawBackground();
  drawMiniMap();
  updateHUD();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === 'e') handleInteraction();
  if (key === ' ') {
    const mission = missionTemplates[player.currentMission];
    if (mission && dist(player, mission.target) < mission.radius) {
      handleInteraction();
    }
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

setupBuildings();
setupNPCs();
setupPolice();
setupVehicles();
updateHUD();
requestAnimationFrame(loop);
