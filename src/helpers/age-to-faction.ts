export const ageToFaction = (age: number): string => {
  if (age <= 24) {
    return '18,30';
  }
  if (age <= 30) {
    return '24,36';
  }
  if (age <= 36) {
    return '30,42';
  }
  if (age <= 42) {
    return '36,48';
  }
  if (age <= 48) {
    return '42,54';
  }
  if (age <= 54) {
    return '48,60';
  }

  return '54,66';
};

export const ageToFactionId = (age: number): number => {
  if (age <= 28) {
    return 1;
  }
  if (age <= 39) {
    return 2;
  }
  if (age <= 50) {
    return 3;
  }

  return 4;
};

export const calcAge = (dob: Date | null): number | null => {
  if (dob === null) return null;
  const today = new Date().getTime();
  const birth = new Date(dob).getTime();
  return Math.floor((today - birth) / 3.15576e10);
};
