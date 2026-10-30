export class Hud {
  render(ctx, session, localPlayer, remotePlayer) {
    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';

    ctx.fillText(`Welle: ${session ? 1 : 1}`, 20, 32);
    ctx.fillText(`Spieler: ${session?.players.size ?? 1} / 2`, 20, 56);

    if (localPlayer) {
      this.drawHealthBar(ctx, 20, 76, localPlayer, 'Du');
    }

    if (remotePlayer) {
      this.drawHealthBar(ctx, 20, 116, remotePlayer, 'Partner');
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