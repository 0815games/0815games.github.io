export class Hud {
  render(ctx, session) {
    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';

    const role = session?.role ?? 'solo';
    const code = session?.code ?? '—';

    ctx.fillText(`Session: ${code}`, 20, 32);
    ctx.fillText(`Rolle: ${role}`, 20, 56);
    ctx.fillText(`Spieler: ${session?.players.size ?? 1} / 2`, 20, 80);
  }
}