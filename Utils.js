/**
 * Convert degrees to radians
 * @param {Number} angle Angle in degrees
 * @returns {Number} Angle in radians
 */
export function degToRad(angle) {
    return angle * (Math.PI/180);
};

/**
 * Convert radians to degress
 * @param {Number} angle Angle in radians
 * @returns {Number} Angle in degrees
 */
export function radToDeg(angle) {
    return angle * (180/Math.PI);
};