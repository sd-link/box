import { TestBed, inject } from '@angular/core/testing';

import { HelperTextService } from './helper-text.service';

describe('HelperTextService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HelperTextService]
    });
  });

  it('should be created', inject([HelperTextService], (service: HelperTextService) => {
    expect(service).toBeTruthy();
  }));
});
