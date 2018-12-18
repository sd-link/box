import {inject, TestBed} from '@angular/core/testing';

import {CustomizerDataService} from './customizer-data.service';

describe('CustomizerDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CustomizerDataService]
        });
    });

    it('should be created', inject([CustomizerDataService], (service: CustomizerDataService) => {
        expect(service).toBeTruthy();
    }));
});
