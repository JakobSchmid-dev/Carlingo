/**
 * Which of two engines is more powerful? Power is asked as a comparison, never as an exact number.
 * One engine always belongs to the vehicle asked about; the other is another engine of the same
 * vehicle or of a vehicle in the pool.
 */
import type { Vehicle, VehicleEngine } from '../../content/schema.ts';
import { KW_PER_PS, MIN_POWER_DIFFERENCE } from '../config.ts';
import type { AnswerOption, QuestionGenerator } from '../types.ts';
import { text } from './shared.ts';

interface PoweredEngine {
  vehicle: Vehicle;
  engine: VehicleEngine;
  kw: number;
}

function powerKw(engine: VehicleEngine): number | undefined {
  if (engine.powerKw !== undefined) return engine.powerKw;
  if (engine.powerPs !== undefined) return engine.powerPs * KW_PER_PS;
  return undefined;
}

function engines(vehicle: Vehicle): PoweredEngine[] {
  return vehicle.engines.flatMap((engine) => {
    const kw = powerKw(engine);
    return kw === undefined ? [] : [{ vehicle, engine, kw }];
  });
}

function comparable(base: PoweredEngine, pool: readonly Vehicle[]): PoweredEngine[] {
  return pool
    .flatMap(engines)
    .filter(
      (other) =>
        other.engine.name !== base.engine.name &&
        Math.abs(other.kw - base.kw) / Math.max(other.kw, base.kw) >= MIN_POWER_DIFFERENCE,
    );
}

function withVehicle(vehicle: Vehicle, pool: readonly Vehicle[]): readonly Vehicle[] {
  return pool.some((v) => v.id === vehicle.id) ? pool : [vehicle, ...pool];
}

function option(p: PoweredEngine, askedAbout: Vehicle): AnswerOption {
  return {
    id: `${p.vehicle.id}:${p.engine.name}`,
    label: text(p.engine.name),
    reveal: {
      ...(p.engine.powerKw !== undefined ? { powerKw: p.engine.powerKw } : {}),
      ...(p.engine.powerPs !== undefined ? { powerPs: p.engine.powerPs } : {}),
      ...(p.vehicle.id !== askedAbout.id ? { vehicleName: p.vehicle.displayName } : {}),
    },
  };
}

export const powerCompare: QuestionGenerator = {
  id: 'power-compare',
  skill: 'power',
  canGenerate: (vehicle, pool) =>
    engines(vehicle).some((base) => comparable(base, withVehicle(vehicle, pool)).length > 0),
  generate(vehicle, pool, ctx) {
    const all = withVehicle(vehicle, pool);
    const base = ctx.rng.pick(engines(vehicle).filter((b) => comparable(b, all).length > 0));
    const candidates = ctx.rng.shuffle(comparable(base, all));
    const gap = (p: PoweredEngine) => Math.abs(p.kw - base.kw);
    // Difficulty 3: closest power; 1: largest gap; 2: random.
    if (ctx.difficulty === 3) candidates.sort((a, b) => gap(a) - gap(b));
    if (ctx.difficulty === 1) candidates.sort((a, b) => gap(b) - gap(a));
    const other = candidates[0];
    if (!other) throw new Error(`power-compare: keine Vergleichsmotorisierung für ${vehicle.id}`);

    const stronger = other.kw > base.kw ? other : base;
    const options = ctx.rng.shuffle([base, other]).map((p) => option(p, vehicle));
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'power-compare', subject: vehicle.displayName },
      options,
      correctOptionId: option(stronger, vehicle).id,
    };
  },
};
