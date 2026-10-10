export function registrationLocation(location) {
  const candidate = new URLSearchParams(location.search).get('pack');
  return { pack: ['500', '1500'].includes(candidate) ? candidate : '' };
}
