import { LearningProgressStorageService } from './learning-progress-storage.service';

describe('LearningProgressStorageService', () => {
  let service: LearningProgressStorageService;

  beforeEach(() => {
    service = new LearningProgressStorageService();
    service.clear();
  });

  it('returns empty versioned state when storage is empty', () => {
    const state = service.load();

    expect(state.version).toBe(1);
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
  });

  it('ignores malformed stored data', () => {
    localStorage.setItem('math-ilde-learning-progress', '{invalid');

    expect(service.load().sessions).toEqual([]);
  });
});
