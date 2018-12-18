import {Component, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';

@Component({
    selector: 'modal-content',
    templateUrl: './login-modal.component.html',
    styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {

    constructor(private modalRef: BsModalRef) {
    }

    ngOnInit() {
    }

    close() {
        this.modalRef.hide();
    }
}
