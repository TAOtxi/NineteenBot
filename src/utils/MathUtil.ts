import { Vec3 } from 'vec3';

const PI = Math.PI;
const PI_2 = Math.PI * 2;
const TO_RAD = PI / 180;
const TO_DEG = 1 / TO_RAD;
const FROM_NOTCH_BYTE = 360 / 256;
const FROM_NOTCH_VEL = 1 / 8000;


function euclideanMod(numerator: number, denominator: number) {
  const result = numerator % denominator;
  return result < 0 ? result + denominator : result;
}

function toRadians (degrees: number) {
  return TO_RAD * degrees;
}

function toDegrees (radians: number) {
  return TO_DEG * radians;
}

function fromNotchianYaw (yaw: number) {
  return euclideanMod(PI - toRadians(yaw), PI_2);
}

function toNotchianYaw (yaw: number) {
  return toDegrees(PI - yaw);
}

function toNotchianPitch (pitch: number) {
  return toDegrees(-pitch);
}

function fromNotchianPitch (pitch: number) {
  return euclideanMod(toRadians(-pitch) + PI, PI_2) - PI;
}

function fromNotchVelocity (vel: Vec3) {
  return new Vec3(vel.x * FROM_NOTCH_VEL, vel.y * FROM_NOTCH_VEL, vel.z * FROM_NOTCH_VEL);
}

function fromNotchianYawByte (yaw: number) {
  return fromNotchianYaw(yaw * FROM_NOTCH_BYTE);
}

function fromNotchianPitchByte (pitch: number) {
  return fromNotchianPitch(pitch * FROM_NOTCH_BYTE);
}

export {
  toRadians,
  toDegrees,
  fromNotchianYaw,
  fromNotchianPitch,
  fromNotchVelocity,
  toNotchianYaw,
  toNotchianPitch,
  fromNotchianYawByte,
  fromNotchianPitchByte,
}