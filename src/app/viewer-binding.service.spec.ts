import { TestBed, inject } from '@angular/core/testing';

import { ViewerBindingService } from './viewer-binding.service';

describe('ViewerBindingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewerBindingService]
    });
  });

  it('should be created', inject([ViewerBindingService], (service: ViewerBindingService) => {
    expect(service).toBeTruthy();
  }));
});
