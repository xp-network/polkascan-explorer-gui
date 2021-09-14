/*
 * Polkascan Explorer GUI
 *
 * Copyright 2018-2020 openAware BV (NL).
 * This file is part of Polkascan.
 *
 * Polkascan is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Polkascan is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Polkascan. If not, see <http://www.gnu.org/licenses/>.
 *
 * dashboard.component.ts
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Block} from '../../classes/block.class';
import {interval, Observable, Subscription} from 'rxjs';
import {Networkstats} from '../../classes/networkstats.class';
import {BlockService} from '../../services/block.service';
import {NetworkstatsService} from '../../services/networkstats.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {AppConfigService} from '../../services/app-config.service';
import {environment} from '../../../environments/environment';
import {AnalyticsChart} from '../../classes/analytics-chart.class';
import {AnalyticsChartService} from '../../services/analytics-chart.service';


type ChartData = {
	type: string,
	data: [number, number]
}

function normChart(an: AnalyticsChart): Array<Array<number>> {
	const rawdat: Array<Array<number>> = an.attributes.data as any;

	return rawdat.map((v, i) => {
		const cp = [...v]
		cp[1] -= i != 0 ? rawdat[i-1][1] : 0
		return cp;
	});
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public blocks: DocumentCollection<Block>;
  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public networkstats$: Observable<Networkstats>;

  blockSearchText: string;
  private blockUpdateSubsription: Subscription;

  private networkSubscription: Subscription;
  public networkURLPrefix: string;
  public networkTokenDecimals = 0;
  public networkTokenSymbol = '';
  public networkColor: string;

  public averageBlocktimeDaychart$: Observable<AnalyticsChart>;
  public totalTransactionsDaychart$: Observable<AnalyticsChart>;
  public cumulativeAccountsDayChart$: Observable<AnalyticsChart>;

  constructor(
    private blockService: BlockService,
    private balanceTransferService: BalanceTransferService,
    private networkstatsService: NetworkstatsService,
    private appConfigService: AppConfigService,
    private analyticsChartService: AnalyticsChartService,
    private router: Router,
    private http: HttpClient) {

  }

  public calcAverageBlockTime(data: Array<number>) {
	  return [data[0], data[1]/data[2]];
  }
  public graph_open(){
		var first_graph = document.getElementById("graph_2").getAttribute("data-id");
		document.getElementById(first_graph).style.display = 'block';
		document.getElementById("graph_3").style.display = 'block';
		document.getElementById("graph_2").style.display = 'none';
  }
  public graph_open_sec(){
	var first_graph_sec = document.getElementById("graph_3").getAttribute("data-id");
	document.getElementById(first_graph_sec).style.display = 'block';
	document.getElementById("graph_3").style.display = 'none';
  }	
  ngOnInit() {
	
    this.blockSearchText = '';

		this.networkSubscription = this.appConfigService.getCurrentNetwork().subscribe( network => {
      this.networkURLPrefix = this.appConfigService.getUrlPrefix();
      this.networkTokenDecimals = +network.attributes.token_decimals;
      this.networkTokenSymbol = network.attributes.token_symbol;
      this.getBlocks();
      this.networkstats$ = this.networkstatsService.get('latest');


	this.networkColor = '#' + network.attributes.color_code;

	this.totalTransactionsDaychart$ = this.analyticsChartService.get('extrinsic');
	this.cumulativeAccountsDayChart$ = this.analyticsChartService.get('account');
	this.averageBlocktimeDaychart$ = this.analyticsChartService.get('blocktime');
	});

    const blockUpdateCounter = interval(6000);

    this.blockUpdateSubsription = blockUpdateCounter.subscribe( n => {
      this.getBlocks();
      this.networkstats$ = this.networkstatsService.get('latest');
    });
  }

  getBlocks(): void {
    this.blockService.all({
      page: {number: 0}
    }).subscribe(blocks => (this.blocks = blocks));

    this.balanceTransferService.all({
      page: {number: 0}
    }).subscribe(balanceTransfers => (this.balanceTransfers = balanceTransfers));

  }

  search(): void {
    // Strip whitespace from search text
    this.blockSearchText = this.blockSearchText.trim();
    if (this.blockSearchText !== '') {
      this.router.navigate([this.networkURLPrefix, 'analytics', 'search', this.blockSearchText]);
    }
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.blockUpdateSubsription.unsubscribe();
    this.networkSubscription.unsubscribe();
  }
}
