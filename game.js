* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  background: #05080a;
  color: #edf6f1;
  font-family: Arial, Helvetica, sans-serif;
}

body {
  min-height: 100vh;
  background: radial-gradient(circle at top, #1b2d28, #090d11 42%, #05070a 100%);
}

button {
  font: inherit;
}

.game-shell {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: rgba(10, 16, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24);
}

.brand-wrap {
  display: flex;
  flex-direction: column;
}

.brand {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.12rem;
  color: #81ef9d;
}

.sub-brand {
  color: #a7d4c0;
  letter-spacing: 0.08rem;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 18px;
}

.stat {
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat span {
  font-size: 0.7rem;
  letter-spacing: 0.08rem;
  text-transform: uppercase;
  color: #b8cfc9;
}

.stat strong {
  font-size: 1.08rem;
}

.action-toolbar {
  display: flex;
  gap: 10px;
  margin: 14px 0;
}

.action-toolbar button {
  background: linear-gradient(180deg, #264f45, #1b322d);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.action-toolbar button:hover {
  transform: translateY(-1px);
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

#gameCanvas {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
  background: #1b2a27;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 38px rgba(0, 0, 0, 0.28);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card {
  background: rgba(13, 21, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.18);
}

.card h3 {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  font-size: 0.86rem;
  color: #9bf0b0;
}

.card p,
.card li {
  color: #ebf4f0;
  line-height: 1.5;
}

.card ul {
  padding-left: 18px;
  margin: 0;
}

#feedList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#feedList li {
  background: rgba(255, 255, 255, 0.03);
  border-left: 2px solid #81ef9d;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.mini-map-wrap {
  min-height: 190px;
}

#miniMap {
  width: 100%;
  border-radius: 10px;
  background: rgba(7, 14, 16, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 1200px) {
  .game-layout {
    grid-template-columns: 1fr;
  }

  .panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}
