import { TestBed, inject } from '@angular/core/testing';

import { InteractionEventService } from './interaction-event.service';

describe('InteractionEventService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractionEventService]
    });
  });

  it('should be created', inject([InteractionEventService], (service: InteractionEventService) => {
    expect(service).toBeTruthy();
  }));
});
