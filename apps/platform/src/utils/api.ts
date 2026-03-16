// apps/platform/src/utils/api.ts
import ky from 'ky';

export const api = ky.create({
  prefixUrl: 'http://localhost:8000',
});