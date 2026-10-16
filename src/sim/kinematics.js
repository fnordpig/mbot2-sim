import { ROBOT_CONSTANTS } from './robot.js';
import { moveCircle } from './collision.js';

/**
 * Integrate one timestep of differential-drive kinematics.
 * robot.x and robot.y are in cm. Mutates robot in place.
 *
 * @param {object} robot - {x, y, theta} in cm/rad, vL/vR in RPM
 * @param {number} dt - delta time in seconds
 */
export function step(robot, dt, { endOnCollision = true } = {}) {
  const { WHEEL_CIRCUMFERENCE_CM, TRACK_WIDTH_CM } = ROBOT_CONSTANTS;

  robot.collided = false;
  robot.collision = null;

  // RPM → cm/s per wheel
  const vL_cms = (robot.vL / 60) * WHEEL_CIRCUMFERENCE_CM;
  const vR_cms = (robot.vR / 60) * WHEEL_CIRCUMFERENCE_CM;

  // Body-frame velocities
  const vLinear = (vL_cms + vR_cms) / 2;             // cm/s
  const vAngular = (vL_cms - vR_cms) / TRACK_WIDTH_CM; // rad/s — (vL−vR)/L for y-down canvas

  // World-frame deltas (in cm)
  const dx = vLinear * Math.cos(robot.theta) * dt;
  const dy = vLinear * Math.sin(robot.theta) * dt;
  const dTheta = vAngular * dt;

  // Always apply rotation
  robot.gyroCumulativeRad += dTheta; // signed accumulator — never normalised
  robot.theta += dTheta;
  if (robot.theta > Math.PI) robot.theta -= 2 * Math.PI;
  if (robot.theta < -Math.PI) robot.theta += 2 * Math.PI;

  const movement = moveCircle(robot.x, robot.y, dx, dy, ROBOT_CONSTANTS.BODY_RADIUS_CM, endOnCollision);
  robot.x = movement.x;
  robot.y = movement.y;
  robot.collision = movement.collision;
  robot.collided = movement.collision !== null;

  robot.totalDistanceCm += Math.abs(vLinear) * dt;
  robot.totalRotationRad += Math.abs(dTheta);
  robot.encoderLeftAbs  += Math.abs((robot.vL / 60) * dt);
  robot.encoderRightAbs += Math.abs((robot.vR / 60) * dt);
}
