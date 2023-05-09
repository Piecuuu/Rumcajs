export class Format {
  static formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  static secondsToHms(seconds: number) {
    const intervals: { label: string, seconds: number }[] = [
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ];

    const parts: { label: string, count: number }[] = [];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) {
        parts.push({ label: interval.label, count: count });
      }
      seconds -= count * interval.seconds;
    }

    parts.sort((a, b) => {
      const intervalsOrder = ['week', 'day', 'hour', 'minute', 'second'];
      return intervalsOrder.indexOf(a.label) - intervalsOrder.indexOf(b.label);
    });

    const result = parts.map(part => `${part.count} ${part.label}${part.count !== 1 ? 's' : ''}`).join(', ')
    if(result.length > 2000) throw new Error("Time too long")

    return result
  }

  static convertToMilliseconds(timeString: string): number {
    const timeUnits: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000
    };

    const timeRegex = /(\d+)\s*([a-z]+)/gi;
    let match: RegExpExecArray | null;
    let totalMs = 0;

    while ((match = timeRegex.exec(timeString))) {
      const value = Number(match[1]);
      const unit = match[2];

      if (!timeUnits[unit]) {
        throw new Error(JSON.stringify({
          code: 0,
          clearMessage: `Invalid time unit: ${unit}`,
          data: {
            unit: unit
          }
        }));
      }

      totalMs += value * timeUnits[unit];
    }

    if (totalMs <= 0) {
      throw new Error(JSON.stringify({
        code: 1,
        clearMessage: "Time duration must be positive."
      }));
    }

    return totalMs;
  }
}
