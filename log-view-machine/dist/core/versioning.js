export function satisfiesVersion(version, constraint) {
    if (constraint.exactVersion) {
        return version === constraint.exactVersion;
    }
    if (constraint.minVersion && !isVersionGreaterOrEqual(version, constraint.minVersion)) {
        return false;
    }
    if (constraint.maxVersion && !isVersionGreaterOrEqual(constraint.maxVersion, version)) {
        return false;
    }
    return true;
}
function isVersionGreaterOrEqual(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1 = v1Parts[i] || 0;
        const v2 = v2Parts[i] || 0;
        if (v1 > v2)
            return true;
        if (v1 < v2)
            return false;
    }
    return true;
}
