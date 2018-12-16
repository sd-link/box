import { TestBed, inject } from '@angular/core/testing';

import { AppearanceDataService } from './appearance-data.service';

describe('AppearanceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppearanceDataService]
    });
  });

  it('should be created', inject([AppearanceDataService], (service: AppearanceDataService) => {
    expect(service).toBeTruthy();
  }));
});
