/**
 * Full outfit — UNIFIED JUMPSUIT polygon, no waist seam.
 *
 * One continuous shape from collar to ankle so the outline reads as a single
 * outfit (jumpsuit / catsuit), not a shirt + pants pair with a visible join.
 * Sub-styles only vary the sleeve length and overall fit.
 */

import { BodyAxes, FullSub, Point } from './types';

export function buildJumpsuit(ax: BodyAxes, sub: FullSub): Point[] {
  const { lSh, rSh, lHip, rHip, hipMid, shW, torsoH, point } = ax;

  let capOut: number;
  let sleeveLen: number;
  let sleeveOuter: number;
  let sleeveInner: number;

  switch (sub) {
    case 'summer':
      capOut = 0; sleeveLen = 0; sleeveOuter = 0; sleeveInner = 0;
      break;
    case 'formal':
      capOut = 0.14; sleeveLen = 1.05; sleeveOuter = 0.10; sleeveInner = 0.08;
      break;
    case 'casual':
    default:
      capOut = 0.16; sleeveLen = 0.28; sleeveOuter = 0.20; sleeveInner = 0.04;
      break;
  }

  // Neckline
  const collarL = point(lSh, -torsoH * 0.02, +shW * 0.16);
  const collarR = point(rSh, -torsoH * 0.02, -shW * 0.16);

  // Shoulder cap
  const capL = point(lSh, torsoH * 0.02, -shW * capOut);
  const capR = point(rSh, torsoH * 0.02, +shW * capOut);

  // Sleeve cuff (collapses to shoulder for summer/sleeveless)
  const cuffOuterL = point(lSh, torsoH * sleeveLen, -shW * sleeveOuter);
  const cuffOuterR = point(rSh, torsoH * sleeveLen, +shW * sleeveOuter);
  const cuffInnerL = point(lSh, torsoH * sleeveLen, +shW * sleeveInner);
  const cuffInnerR = point(rSh, torsoH * sleeveLen, -shW * sleeveInner);

  // Underarm + body side (continuous from underarm down the hip)
  const underL = point(lSh, torsoH * 0.24, +shW * 0.06);
  const underR = point(rSh, torsoH * 0.24, -shW * 0.06);

  // Hip flare (jumpsuit body)
  const hipFlareL = point(hipMid, 0, -shW * 0.58);
  const hipFlareR = point(hipMid, 0, +shW * 0.58);

  // Legs — straight cut to ankle
  const lKneeOuter = point(lHip, torsoH * 0.50, -shW * 0.22);
  const rKneeOuter = point(rHip, torsoH * 0.50, +shW * 0.22);
  const lAnkleOuter = point(lHip, torsoH * 0.95, -shW * 0.18);
  const rAnkleOuter = point(rHip, torsoH * 0.95, +shW * 0.18);

  const crotch = point(hipMid, torsoH * 0.18, 0);
  const lKneeInner = point(hipMid, torsoH * 0.50, -shW * 0.08);
  const rKneeInner = point(hipMid, torsoH * 0.50, +shW * 0.08);
  const lAnkleInner = point(hipMid, torsoH * 0.95, -shW * 0.06);
  const rAnkleInner = point(hipMid, torsoH * 0.95, +shW * 0.06);

  const lAnkleBottom = point(lHip, torsoH * 1.00, -shW * 0.16);
  const rAnkleBottom = point(rHip, torsoH * 1.00, +shW * 0.16);
  const lAnkleBottomInner = point(hipMid, torsoH * 1.00, -shW * 0.05);
  const rAnkleBottomInner = point(hipMid, torsoH * 1.00, +shW * 0.05);

  return [
    collarL, collarR,
    capR, cuffOuterR, cuffInnerR, underR,
    hipFlareR,
    rKneeOuter, rAnkleOuter, rAnkleBottom, rAnkleBottomInner, rAnkleInner, rKneeInner,
    crotch,
    lKneeInner, lAnkleInner, lAnkleBottomInner, lAnkleBottom, lAnkleOuter, lKneeOuter,
    hipFlareL,
    underL, cuffInnerL, cuffOuterL, capL,
  ];
}
