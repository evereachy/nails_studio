const MOCK_BUSY: Record<string, Array<[string, number]>> = {
  "+0": [["11:00", 120], ["15:00", 180]],
  "+1": [["09:00", 90], ["13:00", 60], ["16:30", 90]],
  "+2": [["10:00", 180]],
  "+3": [["12:00", 120], ["17:00", 60]],
};

export function getMockBusy(dateISO: string): Array<[string, number]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return MOCK_BUSY[`+${diff}`] ?? [];
}
