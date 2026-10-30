export class Hud {
  render(ctx, session, localPlayer, remotePlayer, world) {
    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';

    ctx.fillText(`Welle: ${world?.wave ?? 1}`, 20, 32);
    ctx.fillText(`Gold: ${world?.gold ?? 0}`, 20, 56);
    ctx.fillText(`Türme: ${world?.towers.length ?? 0}`, 20, 80);
    ctx.fillText(`Turm-Upgrade: 50 Gold pro Stufe`, 20, 104);
    ctx.fillText(`Spieler: ${session?.players.size ?? 1} / 2`, 20, 128);

    if (localPlayer) {
      this.drawHealthBar(ctx, 20, 152, localPlayer, 'Du');
    }

    if (remotePlayer) {
      this.drawHealthBar(ctx, 20, 192, remotePlayer, 'Partner');
    }
  }

  drawHealthBar(ctx, x, y, player, label) {
    const width = 180;
    const ratio = Math.max(player.health / player.maxHealth, 0);

    ctx.fillStyle = '#eaf2ff';
    ctx.fillText(`${label}: ${Math.ceil(player.health)} HP`, x, y - 6);

    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, width, 10);

    ctx.fillStyle = player.alive ? '#22c55e' : '#ef4444';
    ctx.fillRect(x, y, width * ratio, 10);
  }
}