const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.getElementById('miniMap');
const mmCtx = miniMap.getContext('2d');

const cashValue = document.getElementById('cashValue');
const wantedValue = document.getElementById('wantedValue');
const healthValue = document.getElementById('healthValue');
const districtValue = document.getElementById('districtValue');
const missionText = document.getElementById('missionText');
const objectiveText = document.getElementById('objectiveText');
const weaponText = document.getElementById('weaponText');
const ammoText = document.getElementById('ammoText');
const vehicleText = document.getElementById('vehicleText');
const feedList = document.getElementById('feedList');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');

const WORLD = { width: 2600, height: 1800 };
const keys = {};
const pointer = { x: canvas.width / 2, y: canvas.height / 2 };
const bullets = [];
const pickups = [];
const buildings = [];
const npcs = [];
const police = [];
const vehicles = [];

const WEAPONS = [
  { name: 'Pistol', color: '#f7d46a', damage: 18, fireRate: 0.24, speed: 560, pellets: 1, spread: 0.05 },
  { name: 'Shotgun', color: '#ff8b66', damage: 10, fireRate: 0.7, speed: 430, pellets: 6, spread: 0.35, ammo: 18 },
];

const MISSIONS = [
  { title: 'Hillbrow pickup', route: 'Meet the courier in Hillbrow', target: { x: 1820, y: 430 }, radius: 90, reward: 2200 },
  { title: 'Soweto delivery', route: 'Drive the package to Soweto', target: { x: 940, y: 1170 }, radius: 110, reward: 3800 },
  { title: 'Police escape', route: 'Lose the police in Durban Bay', target: { x: 1510, y: 1570 }, radius: 120, reward: 4900 },
  { title: 'Taxi-rank takeover', route: 'Take control of the taxi rank', target: { x: 720, y: 1290 }, radius: 100, reward: 6200 },
  { title: 'Warehouse heist', route: 'Break into the docks warehouse', target: { x: 2010, y: 1480 }, radius: 110, reward: 8200 },
];

const DISTRICTS = [
  { name: 'Johannesburg CBD', x: 620, y: 220, w: 820, h: 470 },
  { name: 'Hillbrow', x: 1600, y: 230, w: 620, h: 350 },
  { name: 'Soweto', x: 620, y: 900, w: 780, h: 520 },
  { name: 'Cape Town Strip', x: 1460, y: 980, w: 770, h: 440 },
  { name: 'Durban Bay', x: 1020, y: 1460, w: 880, h: 220 },
];

const camera = { x: 0, y: 0 };

const state = {
  lastTime: performance.now(),
  feed: [],
  missionIndex: 0,
  gameOver: false,
};

const player = {
  x: 1120,
  y: 700,
  radius: 17,
  vx: 0,
  vy: 0,
  speed: 175,
  angle: 0,
  inVehicle: false,
  currentVehicle: null,
  cash: 2500,
  wanted: 0,
  health: 100,
  district: 'Johannesburg CBD',
  weaponIndex: 0,
  ammo: { pistol: Infinity, shotgun: 18 },
  lastShot: 0,
  lastSave: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addFeed(message) {
  state.feed.unshift(message);
  state.feed = state.feed.slice(0, 8);
  feedList.innerHTML = state.feed.map((entry) => `<li>${entry}</li>`).join('');
}

function getCurrentDistrict(x, y) {
  const d = DISTRICTS.find((region) => x > region.x && x < region.x + region.w && y > region.y && y < region.y + region.h);
  return d ? d.name : 'Open Road';
}

function loadGame() {
  const raw = localStorage.getItem('slotter-empire-save');
  if (!raw) {
    return false;
  }

  try {
    const data = JSON.parse(raw);
    player.x = data.player.x ?? player.x;
    player.y = data.player.y ?? player.y;
    player.cash = data.player.cash ?? player.cash;
    player.wanted = data.player.wanted ?? player.wanted;
    player.health = data.player.health ?? player.health;
    player.weaponIndex = data.player.weaponIndex ?? player.weaponIndex;
    player.ammo.shotgun = data.player.ammo?.shotgun ?? player.ammo.shotgun;
    state.missionIndex = data.missionIndex ?? state.missionIndex;
    addFeed('Loaded saved empire progress');
    return true;
  } catch (error) {
    console.warn('Save file invalid:', error);
    return false;
  }
}

function saveGame() {
  const data = {
    player: {
      x: player.x,
      y: player.y,
      cash: player.cash,
      wanted: player.wanted,
      health: player.health,
      weaponIndex: player.weaponIndex,
      ammo: { shotgun: player.ammo.shotgun },
    },
    missionIndex: state.missionIndex,
  };

  localStorage.setItem('slotter-empire-save', JSON.stringify(data));
  addFeed('Empire state saved');
}

function resetGame() {
  localStorage.removeItem('slotter-empire-save');
  player.x = 1120;
  player.y = 700;
  player.vx = 0;
  player.vy = 0;
  player.cash = 2500;
  player.wanted = 0;
  player.health = 100;
  player.weaponIndex = 0;
  player.ammo.shotgun = 18;
  player.inVehicle = false;
  player.currentVehicle = null;
  state.missionIndex = 0;
  addFeed('New game started');
}

function buildWorld() {
  buildings.length = 0;
  const worldBuildings = [
    { x: 830, y: 290, w: 170, h: 120 },
    { x: 1060, y: 340, w: 220, h: 150 },
    { x: 1380, y: 300, w: 170, h: 130 },
    { x: 850, y: 560, w: 180, h: 120 },
    { x: 1150, y: 540, w: 220, h: 120 },
    { x: 1710, y: 350, w: 180, h: 170 },
    { x: 1820, y: 650, w: 220, h: 130 },
    { x: 780, y: 1025, w: 260, h: 130 },
    { x: 1120, y: 1015, w: 200, h: 140 },
    { x: 1490, y: 1160, w: 180, h: 150 },
    { x: 1760, y: 1180, w: 220, h: 150 },
    { x: 1190, y: 1560, w: 200, h: 120 },
    { x: 1560, y: 1550, w: 220, h: 120 },
  ];
  buildings.push(...worldBuildings);

  pickups.length = 0;
  pickups.push(
    { x: 1420, y: 620, type: 'ammo', value: 5 },
    { x: 1010, y: 1100, type: 'medkit', value: 30 },
    { x: 1720, y: 790, type: 'ammo', value: 6 },
    { x: 1330, y: 1510, type: 'medkit', value: 25 },
  );

  npcs.length = 0;
  const names = ['Mandla', 'Sihle', 'Anathi', 'Lerato', 'Aphiwe', 'Kamohelo', 'Zanele', 'Nandi', 'Mpho'];
  for (let i = 0; i < 26; i += 1) {
    npcs.push({
      x: 250 + Math.random() * 2050,
      y: 180 + Math.random() * 1400,
      radius: 11,
      name: names[i % names.length],
      color: i % 3 === 0 ? '#dcd7ff' : i % 2 === 0 ? '#ffeb9a' : '#7fe5de',
      mood: ['chatting', 'walking', 'loitering'][Math.floor(Math.random() * 3)],
    });
  }

  police.length = 0;
  police.push(
    { x: 2200, y: 520, radius: 16, color: '#ff7f7f', chasing: false },
    { x: 2350, y: 1480, radius: 16, color: '#ff7f7f', chasing: false },
    { x: 520, y: 1110, radius: 16, color: '#ff7f7f', chasing: false },
    { x: 1980, y: 880, radius: 16, color: '#ff7f7f', chasing: false },
  );

  vehicles.length = 0;
  const vehicleData = [
    { x: 1025, y: 650, color: '#ff6c52', name: 'Bakkie' },
    { x: 1280, y: 620, color: '#6ec6ff', name: 'Rider' },
    { x: 1110, y: 1360, color: '#ffd166', name: 'Courier' },
    { x: 1660, y: 1120, color: '#c687ff', name: 'Taxi' },
    { x: 1980, y: 540, color: '#7ff5a0', name: 'Beast' },
    { x: 750, y: 1285, color: '#cab1ff', name: 'Jetta' },
  ];

  vehicleData.forEach((vehicle) => {
    vehicles.push({
      x: vehicle.x,
      y: vehicle.y,
      w: 38,
      h: 20,
      color: vehicle.color,
      angle: 0,
      occupied: false,
      name: vehicle.name,
    });
  });
}

function updateHUD() {
  cashValue.textContent = `R ${player.cash.toLocaleString()}`;
  wantedValue.textContent = `${player.wanted}★`;
  healthValue.textContent = `${Math.round(player.health)}%`;
  districtValue.textContent = player.district;

  const mission = MISSIONS[state.missionIndex];
  if (!mission) {
    missionText.textContent = 'All missions complete. You own the city.';
    objectiveText.textContent = 'The empire is yours.';
    return;
  }

  missionText.textContent = mission.title;
  objectiveText.textContent = mission.route;

  const weapon = WEAPONS[player.weaponIndex];
  weaponText.textContent = `Weapon: ${weapon.name}`;
  const ammoDisplay = weapon.name === 'Shotgun' ? player.ammo.shotgun : 'infinite';
  ammoText.textContent = `Ammo: ${ammoDisplay}`;
  vehicleText.textContent = player.inVehicle ? `Vehicle: ${player.currentVehicle.name}` : 'Vehicle: on foot';
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keys['w'] || keys['arrowup']) moveY -= 1;
  if (keys['s'] || keys['arrowdown']) moveY += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  const aimX = pointer.x - canvas.width / 2;
  const aimY = pointer.y - canvas.height / 2;
  player.angle = Math.atan2(aimY, aimX);

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    const speedMod = keys.shift ? 1.5 : 1;
    const acceleration = player.inVehicle ? 260 : 180;
    player.vx += (moveX / length) * acceleration * speedMod * dt;
    player.vy += (moveY / length) * acceleration * speedMod * dt;
  }

  const maxSpeed = player.inVehicle ? 360 : 180;
  const currentSpeed = Math.hypot(player.vx, player.vy);
  if (currentSpeed > maxSpeed) {
    const scale = maxSpeed / currentSpeed;
    player.vx *= scale;
    player.vy *= scale;
  }

  const friction = player.inVehicle ? 0.92 : 0.84;
  player.vx *= friction;
  player.vy *= friction;

  if (Math.abs(player.vx) < 0.05) player.vx = 0;
  if (Math.abs(player.vy) < 0.05) player.vy = 0;

  const nextX = player.x + player.vx * dt;
  const nextY = player.y + player.vy * dt;

  const collides = isBlocked(nextX, player.y, player.radius);
  if (!collides) {
    player.x = clamp(nextX, player.radius, WORLD.width - player.radius);
  }

  const collidesY = isBlocked(player.x, nextY, player.radius);
  if (!collidesY) {
    player.y = clamp(nextY, player.radius, WORLD.height - player.radius);
  }

  if (player.inVehicle && player.currentVehicle) {
    player.currentVehicle.x = player.x;
    player.currentVehicle.y = player.y;
    player.currentVehicle.angle = player.angle;
  }

  player.district = getCurrentDistrict(player.x, player.y);
  player.wanted = clamp(player.wanted - 0.18 * dt, 0, 5);

  const mission = MISSIONS[state.missionIndex];
  if (mission && dist(player, mission.target) < mission.radius) {
    completeMission();
  }

  for (const pickup of pickups) {
    if (dist(player, pickup) < 28) {
      if (pickup.type === 'ammo') {
        player.ammo.shotgun += pickup.value;
        addFeed(`Ammo cache found: +${pickup.value} shotgun shells`);
      } else {
        player.health = clamp(player.health + pickup.value, 0, 100);
        addFeed(`Medkit used: health restored by ${pickup.value}%`);
      }
      pickup.collected = true;
    }
  }

  pickups.splice(0, pickups.length, ...pickups.filter((pickup) => !pickup.collected));

  if (Math.random() < 0.02) {
    const reward = Math.random() < 0.5 ? 50 : 100;
    player.cash += reward;
  }

  if (player.health <= 0) {
    player.health = 100;
    player.x = 1120;
    player.y = 700;
    player.wanted = 0;
    player.cash = Math.max(0, player.cash - 500);
    addFeed('You got busted and respawned in CBD.');
  }

  if (Date.now() - player.lastSave > 15000) {
    saveGame();
    player.lastSave = Date.now();
  }
}

function isBlocked(x, y, radius) {
  for (const building of buildings) {
    const px = x;
    const py = y;
    const bx = building.x;
    const by = building.y;
    const bw = building.w;
    const bh = building.h;

    const closestX = clamp(px, bx, bx + bw);
    const closestY = clamp(py, by, by + bh);
    const dx = px - closestX;
    const dy = py - closestY;
    if (dx * dx + dy * dy < radius * radius) {
      return true;
    }
  }
  return false;
}

function getNearestVehicle() {
  let nearest = null;
  let min = Infinity;

  for (const vehicle of vehicles) {
    const distance = dist(player, vehicle);
    if (distance < min) {
      min = distance;
      nearest = vehicle;
    }
  }

  return nearest;
}

function tryToggleVehicle() {
  const nearest = getNearestVehicle();
  if (!nearest) return;

  if (player.inVehicle) {
    player.inVehicle = false;
    player.currentVehicle = null;
    player.x = clamp(player.x + Math.cos(player.angle) * 38, 0, WORLD.width);
    player.y = clamp(player.y + Math.sin(player.angle) * 38, 0, WORLD.height);
    addFeed('Vehicle exited. Moving on foot.');
    return;
  }

  if (dist(player, nearest) < 52) {
    player.inVehicle = true;
    player.currentVehicle = nearest;
    player.x = nearest.x;
    player.y = nearest.y;
    addFeed(`Entered ${nearest.name}.`);
  }
}

function completeMission() {
  const mission = MISSIONS[state.missionIndex];
  if (!mission) return;

  player.cash += mission.reward;
  player.wanted = clamp(player.wanted + 1, 0, 5);
  addFeed(`Mission complete: ${mission.title} +R ${mission.reward.toLocaleString()}`);

  state.missionIndex += 1;
  if (state.missionIndex >= MISSIONS.length) {
    state.missionIndex = MISSIONS.length - 1;
    addFeed('The city is under your control.');
  }
}

function updateNPCs(dt) {
  for (const npc of npcs) {
    npc.x += ((Math.random() - 0.5) * 18) * dt;
    npc.y += ((Math.random() - 0.5) * 18) * dt;

    if (npc.x < 100 || npc.x > WORLD.width - 100) npc.x = clamp(npc.x, 100, WORLD.width - 100);
    if (npc.y < 100 || npc.y > WORLD.height - 100) npc.y = clamp(npc.y, 100, WORLD.height - 100);

    if (dist(player, npc) < 26 && player.wanted > 0) {
      player.cash = Math.max(0, player.cash - 12);
    }
  }
}

function updatePolice(dt) {
  for (const cop of police) {
    if (player.wanted > 0.2) {
      cop.chasing = true;
      const angle = Math.atan2(player.y - cop.y, player.x - cop.x);
      cop.x += Math.cos(angle) * 150 * dt;
      cop.y += Math.sin(angle) * 150 * dt;

      if (dist(player, cop) < 26) {
        player.health -= 20 * dt;
      }
    } else {
      cop.chasing = false;
    }
  }
}

function shoot() {
  const weapon = WEAPONS[player.weaponIndex];
  const now = performance.now();

  if (now - player.lastShot < weapon.fireRate * 1000) {
    return;
  }

  if (player.weaponIndex === 1 && player.ammo.shotgun <= 0) {
    addFeed('Shotgun empty. Find ammo.');
    return;
  }

  const baseX = player.inVehicle ? player.currentVehicle.x : player.x;
  const baseY = player.inVehicle ? player.currentVehicle.y : player.y;

  const pelletCount = weapon.pellets || 1;
  for (let i = 0; i < pelletCount; i += 1) {
    const spread = weapon.spread || 0.05;
    const angle = player.angle + (Math.random() - 0.5) * spread * 2;
    bullets.push({
      x: baseX,
      y: baseY,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      radius: 4,
      color: weapon.color,
      damage: weapon.damage,
      ttl: 1.3,
    });
  }

  if (player.weaponIndex === 1) {
    player.ammo.shotgun -= 1;
  }

  player.lastShot = now;

  for (const cop of police) {
    if (dist({ x: baseX, y: baseY }, cop) < 260) {
      player.wanted = clamp(player.wanted + 0.4, 0, 5);
    }
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.ttl -= dt;

    if (bullet.ttl <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    let hitTarget = false;
    for (const cop of police) {
      if (dist({ x: bullet.x, y: bullet.y }, cop) < cop.radius + bullet.radius) {
        player.cash += 150;
        addFeed('Police officer down. Wanted level rising.');
        cop.x = 2400 + Math.random() * 200;
        cop.y = 150 + Math.random() * 1200;
        hitTarget = true;
        break;
      }
    }

    if (hitTarget) {
      bullets.splice(i, 1);
      continue;
    }

    if (bullet.x < 0 || bullet.x > WORLD.width || bullet.y < 0 || bullet.y > WORLD.height) {
      bullets.splice(i, 1);
    }
  }
}

function drawRoads() {
  ctx.fillStyle = '#25413d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const region of DISTRICTS) {
    const sx = region.x - camera.x + canvas.width / 2;
    const sy = region.y - camera.y + canvas.height / 2;
    ctx.fillStyle = region.name === player.district ? 'rgba(110, 200, 125, 0.16)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(sx, sy, region.w, region.h);
    ctx.fillStyle = '#dfece4';
    ctx.font = '16px sans-serif';
    ctx.fillText(region.name, sx + 16, sy + 28);
  }

  ctx.strokeStyle = '#1b2224';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(300 - camera.x + canvas.width / 2, 220 - camera.y + canvas.height / 2);
  ctx.lineTo(1700 - camera.x + canvas.width / 2, 220 - camera.y + canvas.height / 2);
  ctx.moveTo(680 - camera.x + canvas.width / 2, 700 - camera.y + canvas.height / 2);
  ctx.lineTo(990 - camera.x + canvas.width / 2, 1100 - camera.y + canvas.height / 2);
  ctx.moveTo(1360 - camera.x + canvas.width / 2, 1080 - camera.y + canvas.height / 2);
  ctx.lineTo(2080 - camera.x + canvas.width / 2, 1250 - camera.y + canvas.height / 2);
  ctx.moveTo(1080 - camera.x + canvas.width / 2, 1460 - camera.y + canvas.height / 2);
  ctx.lineTo(1620 - camera.x + canvas.width / 2, 1460 - camera.y + canvas.height / 2);
  ctx.stroke();
}

function drawBuildings() {
  for (const building of buildings) {
    const bx = building.x - camera.x + canvas.width / 2;
    const by = building.y - camera.y + canvas.height / 2;
    ctx.fillStyle = '#425d5e';
    ctx.fillRect(bx, by, building.w, building.h);
    ctx.strokeStyle = '#233a3d';
    ctx.strokeRect(bx, by, building.w, building.h);
  }
}

function drawPickups() {
  for (const pickup of pickups) {
    const px = pickup.x - camera.x + canvas.width / 2;
    const py = pickup.y - camera.y + canvas.height / 2;
    ctx.fillStyle = pickup.type === 'ammo' ? '#ffd166' : '#81ef9d';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNPCs() {
  for (const npc of npcs) {
    const nx = npc.x - camera.x + canvas.width / 2;
    const ny = npc.y - camera.y + canvas.height / 2;
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(nx, ny, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVehicles() {
  for (const vehicle of vehicles) {
    const vx = vehicle.x - camera.x + canvas.width / 2;
    const vy = vehicle.y - camera.y + canvas.height / 2;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(vehicle.angle);
    ctx.fillStyle = vehicle.color;
    ctx.fillRect(-19, -10, 38, 20);
    ctx.fillStyle = '#171d20';
    ctx.fillRect(-8, -7, 16, 14);
    ctx.restore();
  }
}

function drawPolice() {
  for (const cop of police) {
    const px = cop.x - camera.x + canvas.width / 2;
    const py = cop.y - camera.y + canvas.height / 2;
    ctx.fillStyle = cop.chasing ? '#ff5d5d' : '#f7a8a3';
    ctx.beginPath();
    ctx.arc(px, py, cop.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBullets() {
  for (const bullet of bullets) {
    const bx = bullet.x - camera.x + canvas.width / 2;
    const by = bullet.y - camera.y + canvas.height / 2;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bx, by, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMissionMarker() {
  const mission = MISSIONS[state.missionIndex];
  if (!mission) return;

  const mx = mission.target.x - camera.x + canvas.width / 2;
  const my = mission.target.y - camera.y + canvas.height / 2;
  ctx.strokeStyle = '#7af7aa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx, my, mission.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#7af7aa';
  ctx.fillRect(mx - 5, my - 5, 10, 10);
}

function drawPlayer() {
  const px = canvas.width / 2;
  const py = canvas.height / 2;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(player.angle);

  if (player.inVehicle && player.currentVehicle) {
    ctx.fillStyle = '#f7dc6c';
    ctx.fillRect(0, -8, 30, 16);
    ctx.fillStyle = '#0e1b1f';
    ctx.fillRect(-8, -5, 14, 10);
  } else {
    ctx.fillStyle = '#d9f7ff';
    ctx.fillRect(0, -8, 24, 16);
    ctx.fillStyle = '#0f1a1f';
    ctx.fillRect(-6, -4, 10, 8);
  }

  ctx.restore();

  ctx.strokeStyle = '#f4f9ff';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(player.angle) * 30, py + Math.sin(player.angle) * 30);
  ctx.stroke();
}

function drawMiniMap() {
  mmCtx.clearRect(0, 0, miniMap.width, miniMap.height);
  mmCtx.fillStyle = '#0a1318';
  mmCtx.fillRect(0, 0, miniMap.width, miniMap.height);

  for (const district of DISTRICTS) {
    const dx = (district.x / WORLD.width) * miniMap.width;
    const dy = (district.y / WORLD.height) * miniMap.height;
    const dw = (district.w / WORLD.width) * miniMap.width;
    const dh = (district.h / WORLD.height) * miniMap.height;
    mmCtx.fillStyle = '#2b4a4a';
    mmCtx.fillRect(dx, dy, dw, dh);
  }

  const mission = MISSIONS[state.missionIndex];
  if (mission) {
    const mx = (mission.target.x / WORLD.width) * miniMap.width;
    const my = (mission.target.y / WORLD.height) * miniMap.height;
    mmCtx.fillStyle = '#7af7aa';
    mmCtx.fillRect(mx - 4, my - 4, 8, 8);
  }

  const px = (player.x / WORLD.width) * miniMap.width;
  const py = (player.y / WORLD.height) * miniMap.height;
  mmCtx.fillStyle = '#f6f1a1';
  mmCtx.beginPath();
  mmCtx.arc(px, py, 5, 0, Math.PI * 2);
  mmCtx.fill();
}

function render() {
  camera.x = clamp(player.x, 0, WORLD.width - 1);
  camera.y = clamp(player.y, 0, WORLD.height - 1);

  drawRoads();
  drawBuildings();
  drawPickups();
  drawNPCs();
  drawVehicles();
  drawPolice();
  drawBullets();
  drawMissionMarker();
  drawPlayer();
  drawMiniMap();
}

function update(dt) {
  updatePlayer(dt);
  updateNPCs(dt);
  updatePolice(dt);
  updateBullets(dt);
  updateHUD();
}

function frame(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.032);
  state.lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === 'e') {
    tryToggleVehicle();
  }

  if (key === '1') {
    player.weaponIndex = 0;
    addFeed('Equipped Pistol.');
  }

  if (key === '2') {
    player.weaponIndex = 1;
    addFeed('Equipped Shotgun.');
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  pointer.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('mousedown', () => {
  shoot();
});

saveButton.addEventListener('click', saveGame);
resetButton.addEventListener('click', resetGame);

buildWorld();
addFeed('Welcome to Slotter Empire. Build the empire.');
addFeed('Use WASD to move, E to enter vehicles, 1/2 to switch weapons.');
loadGame();
updateHUD();
requestAnimationFrame(frame);
