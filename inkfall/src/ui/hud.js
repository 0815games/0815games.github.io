export class Hud {
  render(ctx, session, localPlayer, remotePlayer, world) {
    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';

    const typeNames = {
      standard: 'Standard',
      frost: 'Frost',
      cannon: 'Kanone'
    };

    const classNames = {
      knight: 'Ritter',
      mage: 'Magier'
    };

    ctx.fillText(`Welle: ${world?.wave ?? 1}`, 20, 32);
    ctx.fillText(`Gold: ${world?.gold ?? 0}`, 20, 56);
    ctx.fillText(`Türme: ${world?.towers.length ?? 0}`, 20, 80);
    ctx.fillText(`Turm: ${typeNames[localPlayer?.towerType] ?? 'Standard'}`, 20, 104);
    ctx.fillText(`Klasse: ${classNames[localPlayer?.className] ?? 'Ritter'}`, 20, 128);

    const cooldown = localPlayer?.abilityCooldown ?? 0;
    ctx.fillText(`Fähigkeit (Q): ${cooldown > 0 ? `${cooldown.toFixed(1)} s` : 'bereit'}`, 20, 152);
    ctx.fillText(`Duo-Synergie: Ritter + Magier innerhalb 1,5 s`, 20, 176);
    ctx.fillText(`Spieler: ${session?.players.size ?? 1} / 2`, 20, 200);

    if (localPlayer) {
      this.drawHealthBar(ctx, 20, 224, localPlayer, 'Du');
    }

    if (remotePlayer) {
      this.drawHealthBar(ctx, 20, 264, remotePlayer, 'Partner');
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