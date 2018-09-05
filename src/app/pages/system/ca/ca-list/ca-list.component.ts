import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'ca-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class CertificateAuthorityListComponent {

  public title = "Certificate Authorities";
  protected queryCall = "certificateauthority.query";
  protected wsDelete = "certificateauthority.delete";
  // protected route_edit: string[] = ['system', 'ca', 'edit'];
  protected route_add: string[] = ['system', 'ca', 'add'];
  protected route_add_tooltip: string = T('Create CA');
  protected route_success: string[] = [ 'system', 'ca' ];

  public busy: Subscription;
  public sub: Subscription;
  protected entityList: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    public snackBar: MatSnackBar) {}

  public columns: Array < any > = [
    { name: T('Name'), prop: 'name' },
    { name: T('Internal'), prop: 'internal' },
    { name: T('Issuer'), prop: 'issuer' },
    { name: T('Distinguished Name'), prop: 'DN' },
    { name: T('From'), prop: 'from' },
    { name: T('Until'), prop: 'until' },
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'export_certificate' && row.certificate === null) {
      return false;
    } else if (actionId === 'export_private_key' && row.privatekey === null) {
      return false;
    }
    return true;
  }

  getActions(row) {
    return [
      {
        id: "View",
        label: T("View"),
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "ca", "view", row.id]))
        }
      },
      {
        id: "sign",
        label: T("Sign CSR"),
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "ca", "sign", row.id]))
        }
      },
      {
        id: "export_certificate",
        label: T("Export Certificate"),
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].certificate_path], res[0].name + '.crt']).subscribe(
                (res) => {
                  this.snackBar.open(T("Opening download window. Make sure pop-ups are enabled in the browser."), T("Success"), {
                    duration: 5000
                  });
                  window.open(res[1]);
                },
                (res) => {
                  new EntityUtils().handleError(this, res);
                }
              );
            }
          })
        }
      },
      {
        id: "export_private_key",
        label: T("Export Private Key"),
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].privatekey_path], res[0].name + '.key']).subscribe(
                (res) => {
                  this.snackBar.open(T("Opening download window. Make sure pop-ups are enabled in the browser."), T("Success"), {
                    duration: 5000
                  });
                  window.open(res[1]);
                },
                (res) => {
                  new EntityUtils().handleError(this, res);
                }
              );
            }
          })
        }
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row.id);
        }
      }];
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.isObject(entityList.rows[i].issuer)) {
        entityList.rows[i].issuer = entityList.rows[i].issuer.name;
      }
    }
  }
}
