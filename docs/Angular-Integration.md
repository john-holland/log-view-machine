# Angular Integration Guide for log-view-machine

## Overview

This guide demonstrates how to integrate log-view-machine with Angular applications, providing Angular-specific services, components, and patterns that mirror the React hooks functionality while leveraging Angular's dependency injection and reactive programming paradigms.

## Table of Contents

- [Angular Services](#angular-services)
  - [ViewStateMachineService](#viewstatemachineservice)
  - [RobotCopyProxyService](#robotcopyproxyservice)
  - [TomeManagerService](#tomemanagerservice)
- [Angular Components](#angular-components)
  - [TomeContextComponent](#tomecontextcomponent)
  - [StateMachineDirective](#statemachinedirective)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Framework Comparison](#framework-comparison)

## Angular Services

### ViewStateMachineService

The `ViewStateMachineService` provides Angular-specific integration for ViewStateMachine instances with reactive observables and dependency injection.

#### Service Implementation

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ViewStateMachine, createViewStateMachine } from 'log-view-machine';

export interface ViewStateMachineState<T = any> {
  state: string;
  context: any;
  logEntries: any[];
  viewStack: any[];
  subMachines: Map<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class ViewStateMachineService<T = any> implements OnDestroy {
  private machine: ViewStateMachine<T>;
  private stateSubject = new BehaviorSubject<ViewStateMachineState<T>>({
    state: 'idle',
    context: {},
    logEntries: [],
    viewStack: [],
    subMachines: new Map()
  });
  private destroy$ = new Subject<void>();

  public readonly state$ = this.stateSubject.asObservable();
  public readonly currentState$ = this.state$.pipe(
    map(state => state.state)
  );
  public readonly context$ = this.state$.pipe(
    map(state => state.context)
  );

  constructor() {
    // Initialize with default machine
    this.machine = createViewStateMachine({
      machineId: 'default-machine',
      xstateConfig: {
        initial: 'idle',
        context: {},
        states: {
          idle: { on: { START: 'active' } },
          active: { on: { STOP: 'idle' } }
        }
      }
    });
  }

  /**
   * Initialize the service with a specific machine configuration
   */
  initialize(config: any): void {
    this.machine = createViewStateMachine(config);
    this.startStateSubscription();
  }

  /**
   * Send an event to the state machine
   */
  send(event: any): void {
    this.machine.send(event);
  }

  /**
   * Log a message
   */
  log(message: string, data?: any): void {
    this.machine.log(message, data);
  }

  /**
   * Add a view to the view stack
   */
  view(component: any): void {
    this.machine.view(component);
  }

  /**
   * Clear the view stack
   */
  clear(): void {
    this.machine.clear();
  }

  /**
   * Transition to a specific state
   */
  transition(state: string, data?: any): void {
    this.machine.transition(state, data);
  }

  /**
   * Create a sub-machine
   */
  subMachine(id: string, config: any): void {
    this.machine.subMachine(id, config);
  }

  /**
   * Get a sub-machine by ID
   */
  getSubMachine(id: string): any {
    return this.machine.getSubMachine(id);
  }

  private startStateSubscription(): void {
    // Subscribe to machine state changes and update the subject
    this.machine.on('stateChange', (newState, newContext) => {
      this.stateSubject.next({
        state: newState,
        context: newContext,
        logEntries: this.machine.logEntries,
        viewStack: this.machine.viewStack,
        subMachines: this.machine.subMachines
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateSubject.complete();
  }
}
```

#### Usage Example

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewStateMachineService } from './services/view-state-machine.service';

@Component({
  selector: 'app-order-management',
  template: `
    <div class="order-management">
      <h2>Order State: {{ currentState }}</h2>
      <div class="order-details">
        <p>Order ID: {{ orderId || 'None' }}</p>
        <p>Items: {{ itemCount }}</p>
      </div>
      <div class="actions">
        <button (click)="startOrder()" [disabled]="currentState !== 'idle'">
          Start Order
        </button>
        <button (click)="completeOrder()" [disabled]="currentState !== 'processing'">
          Complete Order
        </button>
      </div>
      <div class="logs" *ngIf="logEntries.length > 0">
        <h3>Activity Log</h3>
        <div *ngFor="let entry of logEntries" class="log-entry">
          {{ entry.message }} - {{ entry.timestamp | date:'short' }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  currentState = 'idle';
  orderId: string | null = null;
  itemCount = 0;
  logEntries: any[] = [];
  
  private subscription = new Subscription();

  constructor(private viewStateMachineService: ViewStateMachineService) {}

  ngOnInit(): void {
    // Initialize the state machine
    this.viewStateMachineService.initialize({
      machineId: 'order-machine',
      xstateConfig: {
        initial: 'idle',
        context: { orderId: null, items: [] },
        states: {
          idle: {
            on: {
              START_ORDER: {
                target: 'processing',
                actions: 'logOrderStart'
              }
            }
          },
          processing: {
            on: {
              ORDER_COMPLETE: {
                target: 'completed',
                actions: 'logOrderComplete'
              }
            }
          },
          completed: {
            on: {
              NEW_ORDER: {
                target: 'idle',
                actions: 'resetOrder'
              }
            }
          }
        }
      }
    });

    // Subscribe to state changes
    this.subscription.add(
      this.viewStateMachineService.state$.subscribe(state => {
        this.currentState = state.state;
        this.orderId = state.context.orderId;
        this.itemCount = state.context.items?.length || 0;
        this.logEntries = state.logEntries;
      })
    );
  }

  startOrder(): void {
    this.viewStateMachineService.log('Starting new order');
    this.viewStateMachineService.send({ 
      type: 'START_ORDER',
      orderId: this.generateOrderId()
    });
  }

  completeOrder(): void {
    this.viewStateMachineService.log('Completing order');
    this.viewStateMachineService.send({ type: 'ORDER_COMPLETE' });
  }

  private generateOrderId(): string {
    return 'ORDER-' + Date.now();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

### RobotCopyProxyService

The `RobotCopyProxyService` provides Angular integration for RobotCopy messaging with reactive observables.

#### Service Implementation

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { createRobotCopy, RobotCopy } from 'log-view-machine';

export interface MessageEvent {
  type: string;
  data: any;
  timestamp: Date;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RobotCopyProxyService implements OnDestroy {
  private robotCopy: RobotCopy;
  private messagesSubject = new BehaviorSubject<MessageEvent[]>([]);
  private destroy$ = new Subject<void>();

  public readonly messages$ = this.messagesSubject.asObservable();
  public readonly recentMessages$ = this.messages$.pipe(
    map(messages => messages.slice(-10)) // Last 10 messages
  );

  constructor() {
    this.robotCopy = createRobotCopy();
    this.initializeMessageHandling();
  }

  /**
   * Send a message and return an Observable
   */
  sendMessage(type: string, data: any): Observable<any> {
    const messageEvent: MessageEvent = {
      type,
      data,
      timestamp: new Date(),
      success: false
    };

    return from(this.robotCopy.sendMessage(type, data)).pipe(
      map(response => {
        messageEvent.success = true;
        this.addMessage(messageEvent);
        return response;
      }),
      catchError(error => {
        messageEvent.error = error.message;
        this.addMessage(messageEvent);
        throw error;
      })
    );
  }

  /**
   * Register a machine with RobotCopy
   */
  registerMachine(id: string, machine: any, config: any): void {
    this.robotCopy.registerMachine(id, machine, config);
  }

  /**
   * Get backend type
   */
  getBackendType(): Observable<string> {
    return from(this.robotCopy.getBackendType());
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: string): Observable<boolean> {
    return from(this.robotCopy.isEnabled(feature));
  }

  /**
   * Generate a trace ID
   */
  generateTraceId(): string {
    return this.robotCopy.generateTraceId();
  }

  private initializeMessageHandling(): void {
    this.robotCopy.on('message', (message: any) => {
      const messageEvent: MessageEvent = {
        type: message.type,
        data: message.data,
        timestamp: new Date(),
        success: true
      };
      this.addMessage(messageEvent);
    });

    this.robotCopy.on('error', (error: any) => {
      const messageEvent: MessageEvent = {
        type: 'error',
        data: error,
        timestamp: new Date(),
        success: false,
        error: error.message
      };
      this.addMessage(messageEvent);
    });
  }

  private addMessage(message: MessageEvent): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.messagesSubject.complete();
  }
}
```

#### Usage Example

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RobotCopyProxyService } from './services/robot-copy-proxy.service';

@Component({
  selector: 'app-cart-management',
  template: `
    <div class="cart-management">
      <h2>Shopping Cart</h2>
      <div class="cart-items">
        <div *ngFor="let item of cartItems" class="cart-item">
          <span>{{ item.name }}</span>
          <span>${{ item.price }}</span>
          <button (click)="removeItem(item.id)">Remove</button>
        </div>
      </div>
      <div class="actions">
        <button (click)="addSampleItem()">Add Sample Item</button>
        <button (click)="proceedToCheckout()" [disabled]="cartItems.length === 0">
          Proceed to Checkout
        </button>
      </div>
      <div class="message-log" *ngIf="recentMessages.length > 0">
        <h3>Recent Messages</h3>
        <div *ngFor="let message of recentMessages" class="message-entry">
          <span [class.success]="message.success" [class.error]="!message.success">
            {{ message.type }}: {{ message.success ? 'Success' : 'Error' }}
          </span>
          <small>{{ message.timestamp | date:'short' }}</small>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./cart-management.component.scss']
})
export class CartManagementComponent implements OnInit, OnDestroy {
  cartItems: any[] = [];
  recentMessages: any[] = [];
  
  private subscription = new Subscription();

  constructor(private robotCopyService: RobotCopyProxyService) {}

  ngOnInit(): void {
    // Subscribe to recent messages
    this.subscription.add(
      this.robotCopyService.recentMessages$.subscribe(messages => {
        this.recentMessages = messages;
      })
    );
  }

  addSampleItem(): void {
    const sampleItem = {
      id: Date.now(),
      name: 'Sample Product',
      price: 19.99
    };

    this.subscription.add(
      this.robotCopyService.sendMessage('cart/add', { item: sampleItem }).subscribe(
        response => {
          console.log('Item added to cart:', response);
          this.cartItems.push(sampleItem);
        },
        error => {
          console.error('Error adding item to cart:', error);
        }
      )
    );
  }

  removeItem(itemId: number): void {
    this.subscription.add(
      this.robotCopyService.sendMessage('cart/remove', { itemId }).subscribe(
        response => {
          console.log('Item removed from cart:', response);
          this.cartItems = this.cartItems.filter(item => item.id !== itemId);
        },
        error => {
          console.error('Error removing item from cart:', error);
        }
      )
    );
  }

  proceedToCheckout(): void {
    const traceId = this.robotCopyService.generateTraceId();
    
    this.subscription.add(
      this.robotCopyService.sendMessage('checkout/start', { 
        traceId, 
        items: this.cartItems 
      }).subscribe(
        response => {
          console.log('Checkout started:', response);
          // Navigate to checkout page or handle checkout flow
        },
        error => {
          console.error('Error starting checkout:', error);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

### TomeManagerService

The `TomeManagerService` provides Angular integration for managing multiple Tome instances.

#### Service Implementation

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { TomeManager, createTomeManager, TomeConfig, TomeInstance } from 'log-view-machine';

export interface TomeStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  machines: string[];
  lastUpdate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TomeManagerService implements OnDestroy {
  private tomeManager: TomeManager;
  private tomesSubject = new BehaviorSubject<TomeStatus[]>([]);
  private destroy$ = new Subject<void>();

  public readonly tomes$ = this.tomesSubject.asObservable();
  public readonly runningTomes$ = this.tomes$.pipe(
    map(tomes => tomes.filter(tome => tome.status === 'running'))
  );

  constructor() {
    // Initialize with Express app (in real app, inject this)
    const express = require('express');
    const app = express();
    this.tomeManager = createTomeManager(app);
    this.startTomeMonitoring();
  }

  /**
   * Register a new Tome
   */
  registerTome(config: TomeConfig): Observable<TomeInstance> {
    return from(this.tomeManager.registerTome(config)).pipe(
      map(tome => {
        this.updateTomeStatus();
        return tome;
      })
    );
  }

  /**
   * Unregister a Tome
   */
  unregisterTome(id: string): Observable<void> {
    return from(this.tomeManager.unregisterTome(id)).pipe(
      map(() => {
        this.updateTomeStatus();
      })
    );
  }

  /**
   * Start a Tome
   */
  startTome(id: string): Observable<void> {
    return from(this.tomeManager.startTome(id)).pipe(
      map(() => {
        this.updateTomeStatus();
      })
    );
  }

  /**
   * Stop a Tome
   */
  stopTome(id: string): Observable<void> {
    return from(this.tomeManager.stopTome(id)).pipe(
      map(() => {
        this.updateTomeStatus();
      })
    );
  }

  /**
   * Get a Tome by ID
   */
  getTome(id: string): TomeInstance | undefined {
    return this.tomeManager.getTome(id);
  }

  /**
   * List all Tome IDs
   */
  listTomes(): Observable<string[]> {
    return from(this.tomeManager.listTomes());
  }

  /**
   * Get status of all Tomes
   */
  getTomeStatus(): Observable<TomeStatus[]> {
    return this.tomes$;
  }

  /**
   * Send message to a specific machine in a Tome
   */
  sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any): Observable<any> {
    return from(this.tomeManager.sendTomeMessage(tomeId, machineId, event, data));
  }

  private startTomeMonitoring(): void {
    // Monitor Tome status periodically
    setInterval(() => {
      this.updateTomeStatus();
    }, 5000); // Update every 5 seconds
  }

  private updateTomeStatus(): void {
    const tomeStatuses = this.tomeManager.getTomeStatus().map(status => ({
      id: status.id,
      name: status.name,
      status: 'running' as const, // In real implementation, check actual status
      machines: Object.keys(status.machines),
      lastUpdate: new Date()
    }));
    
    this.tomesSubject.next(tomeStatuses);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tomesSubject.complete();
  }
}
```

## Angular Components

### TomeContextComponent

The `TomeContextComponent` provides Angular equivalent of React's TomeContext for automatic state injection.

#### Component Implementation

```typescript
import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ViewStateMachineService } from '../services/view-state-machine.service';
import { RobotCopyProxyService } from '../services/robot-copy-proxy.service';

export interface TomeContextData {
  state: string;
  context: any;
  send: (event: any) => void;
  log: (message: string, data?: any) => void;
  view: (component: any) => void;
  clear: () => void;
  transition: (state: string, data?: any) => void;
  sendMessage: (type: string, data: any) => Observable<any>;
}

@Component({
  selector: 'app-tome-context',
  template: `
    <ng-container *ngTemplateOutlet="contentTemplate; context: contextData"></ng-container>
  `
})
export class TomeContextComponent implements OnInit, OnDestroy {
  @Input() machineConfig: any;
  @Input() robotCopyConfig: any;
  @ViewChild('contentTemplate', { static: true }) contentTemplate!: TemplateRef<any>;

  contextData: TomeContextData = {
    state: 'idle',
    context: {},
    send: () => {},
    log: () => {},
    view: () => {},
    clear: () => {},
    transition: () => {},
    sendMessage: () => new Observable()
  };

  private subscription = new Subscription();

  constructor(
    private viewStateMachineService: ViewStateMachineService,
    private robotCopyService: RobotCopyProxyService
  ) {}

  ngOnInit(): void {
    // Initialize state machine
    if (this.machineConfig) {
      this.viewStateMachineService.initialize(this.machineConfig);
    }

    // Subscribe to state changes
    this.subscription.add(
      this.viewStateMachineService.state$.subscribe(state => {
        this.contextData = {
          state: state.state,
          context: state.context,
          send: (event: any) => this.viewStateMachineService.send(event),
          log: (message: string, data?: any) => this.viewStateMachineService.log(message, data),
          view: (component: any) => this.viewStateMachineService.view(component),
          clear: () => this.viewStateMachineService.clear(),
          transition: (state: string, data?: any) => this.viewStateMachineService.transition(state, data),
          sendMessage: (type: string, data: any) => this.robotCopyService.sendMessage(type, data)
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

#### Usage Example

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-order-system',
  template: `
    <app-tome-context 
      [machineConfig]="orderMachineConfig"
      [robotCopyConfig]="robotCopyConfig">
      <ng-template #contentTemplate let-context="state" let-ctx="context" let-send="send" let-log="log">
        <div class="order-system">
          <header>
            <h1>Order Management System</h1>
            <p>Current State: {{ context }}</p>
            <p>Order ID: {{ ctx.orderId || 'None' }}</p>
          </header>
          
          <main>
            <button (click)="send({ type: 'START_ORDER' })" 
                    [disabled]="context !== 'idle'">
              Start New Order
            </button>
            
            <button (click)="send({ type: 'COMPLETE_ORDER' })" 
                    [disabled]="context !== 'processing'">
              Complete Order
            </button>
          </main>
          
          <footer>
            <p>Items in cart: {{ ctx.items?.length || 0 }}</p>
          </footer>
        </div>
      </ng-template>
    </app-tome-context>
  `,
  styleUrls: ['./order-system.component.scss']
})
export class OrderSystemComponent {
  orderMachineConfig = {
    machineId: 'order-machine',
    xstateConfig: {
      initial: 'idle',
      context: { orderId: null, items: [] },
      states: {
        idle: { on: { START_ORDER: 'processing' } },
        processing: { on: { COMPLETE_ORDER: 'completed' } },
        completed: { on: { NEW_ORDER: 'idle' } }
      }
    }
  };

  robotCopyConfig = {
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: 'https://api.example.com' } }
    ]
  };
}
```

### StateMachineDirective

The `StateMachineDirective` provides a directive-based approach to state machine integration.

#### Directive Implementation

```typescript
import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewStateMachineService } from '../services/view-state-machine.service';

@Directive({
  selector: '[appStateMachine]'
})
export class StateMachineDirective implements OnInit, OnDestroy {
  @Input() appStateMachine: any;
  @Input() initialState: string = 'idle';
  @Output() stateChange = new EventEmitter<any>();
  @Output() contextChange = new EventEmitter<any>();

  private subscription = new Subscription();

  constructor(
    private elementRef: ElementRef,
    private viewStateMachineService: ViewStateMachineService
  ) {}

  ngOnInit(): void {
    if (this.appStateMachine) {
      this.viewStateMachineService.initialize(this.appStateMachine);
      
      this.subscription.add(
        this.viewStateMachineService.state$.subscribe(state => {
          this.stateChange.emit(state);
          this.contextChange.emit(state.context);
          
          // Update element classes based on state
          this.updateElementClasses(state.state);
        })
      );
    }
  }

  private updateElementClasses(state: string): void {
    const element = this.elementRef.nativeElement;
    
    // Remove all state classes
    element.classList.remove('state-idle', 'state-processing', 'state-completed', 'state-error');
    
    // Add current state class
    element.classList.add(`state-${state}`);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

#### Usage Example

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-state-machine-demo',
  template: `
    <div 
      appStateMachine 
      [appStateMachine]="machineConfig"
      (stateChange)="onStateChange($event)"
      (contextChange)="onContextChange($event)"
      class="state-machine-container">
      
      <h2>State Machine Demo</h2>
      <p>Current State: {{ currentState }}</p>
      <p>Context: {{ context | json }}</p>
      
      <div class="actions">
        <button (click)="sendEvent('START')">Start</button>
        <button (click)="sendEvent('PAUSE')">Pause</button>
        <button (click)="sendEvent('RESUME')">Resume</button>
        <button (click)="sendEvent('STOP')">Stop</button>
      </div>
    </div>
  `,
  styles: [`
    .state-machine-container {
      padding: 20px;
      border: 2px solid #ccc;
      border-radius: 8px;
      transition: border-color 0.3s ease;
    }
    
    .state-idle { border-color: #6c757d; }
    .state-processing { border-color: #007bff; }
    .state-completed { border-color: #28a745; }
    .state-error { border-color: #dc3545; }
  `]
})
export class StateMachineDemoComponent {
  currentState = 'idle';
  context: any = {};

  machineConfig = {
    machineId: 'demo-machine',
    xstateConfig: {
      initial: 'idle',
      context: { counter: 0 },
      states: {
        idle: { on: { START: 'processing' } },
        processing: { 
          on: { 
            PAUSE: 'paused',
            STOP: 'idle',
            COMPLETE: 'completed'
          } 
        },
        paused: { on: { RESUME: 'processing', STOP: 'idle' } },
        completed: { on: { RESET: 'idle' } }
      }
    }
  };

  onStateChange(state: any): void {
    this.currentState = state.state;
  }

  onContextChange(context: any): void {
    this.context = context;
  }

  sendEvent(eventType: string): void {
    // This would be handled by the directive or service
    console.log(`Sending event: ${eventType}`);
  }
}
```

## Usage Examples

### Complete E-commerce Angular Application

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { OrderManagementComponent } from './components/order-management/order-management.component';
import { CartManagementComponent } from './components/cart-management/cart-management.component';
import { TomeContextComponent } from './components/tome-context/tome-context.component';
import { ViewStateMachineService } from './services/view-state-machine.service';
import { RobotCopyProxyService } from './services/robot-copy-proxy.service';
import { TomeManagerService } from './services/tome-manager.service';

@NgModule({
  declarations: [
    AppComponent,
    OrderManagementComponent,
    CartManagementComponent,
    TomeContextComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    ViewStateMachineService,
    RobotCopyProxyService,
    TomeManagerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// app.component.ts
import { Component, OnInit } from '@angular/core';
import { TomeManagerService } from './services/tome-manager.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <header>
        <h1>E-commerce Application</h1>
        <nav>
          <a routerLink="/orders">Orders</a>
          <a routerLink="/cart">Cart</a>
          <a routerLink="/tomes">Tome Management</a>
        </nav>
      </header>
      
      <main>
        <router-outlet></router-outlet>
      </main>
      
      <footer>
        <div class="tome-status">
          <h3>Active Tomes</h3>
          <div *ngFor="let tome of runningTomes" class="tome-item">
            <span>{{ tome.name }}</span>
            <span class="status">{{ tome.status }}</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  runningTomes: any[] = [];

  constructor(private tomeManagerService: TomeManagerService) {}

  ngOnInit(): void {
    // Register initial Tome instances
    this.registerInitialTomes();
    
    // Subscribe to running Tome status
    this.tomeManagerService.runningTomes$.subscribe(tomes => {
      this.runningTomes = tomes;
    });
  }

  private registerInitialTomes(): void {
    // Register user management Tome
    this.tomeManagerService.registerTome({
      id: 'user-management',
      name: 'User Management',
      machines: {
        auth: {
          id: 'auth-machine',
          name: 'Authentication Machine',
          xstateConfig: {
            initial: 'loggedOut',
            states: {
              loggedOut: { on: { LOGIN: 'loggedIn' } },
              loggedIn: { on: { LOGOUT: 'loggedOut' } }
            }
          }
        }
      }
    }).subscribe();

    // Register order processing Tome
    this.tomeManagerService.registerTome({
      id: 'order-processing',
      name: 'Order Processing',
      machines: {
        order: {
          id: 'order-machine',
          name: 'Order Machine',
          xstateConfig: {
            initial: 'idle',
            states: {
              idle: { on: { START: 'processing' } },
              processing: { on: { COMPLETE: 'completed' } },
              completed: { on: { RESET: 'idle' } }
            }
          }
        }
      }
    }).subscribe();
  }
}
```

## Best Practices

### 1. Service Organization
- Create separate services for different concerns (ViewStateMachine, RobotCopy, TomeManager)
- Use Angular's dependency injection for service management
- Implement proper cleanup in `OnDestroy` lifecycle hooks

### 2. Reactive Programming
- Leverage RxJS observables for state management
- Use operators like `map`, `filter`, `switchMap` for data transformation
- Implement proper subscription management to prevent memory leaks

### 3. Component Architecture
- Use smart/dumb component pattern with services for state management
- Implement `TomeContextComponent` for automatic state injection
- Use directives for reusable state machine behaviors

### 4. Error Handling
- Implement comprehensive error handling in services
- Use RxJS error operators (`catchError`, `retry`)
- Provide user-friendly error messages and recovery options

### 5. Testing
- Mock services for unit testing
- Use Angular Testing Utilities for component testing
- Test state machine logic independently of Angular components

## UI Component Templating and Generalization

### Overview

The log-view-machine architecture can be generalized to create reusable UI component templates that can be implemented across different frameworks. This section demonstrates how to create framework-agnostic component specifications that can be automatically generated for React, Angular, Mithril, and other frameworks.

### Component Template System

#### 1. Component Specification Format

```typescript
export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  framework: 'react' | 'angular' | 'mithril' | 'vue' | 'generic';
  stateMachine: {
    id: string;
    config: any;
    states: StateTemplate[];
  };
  props: PropTemplate[];
  events: EventTemplate[];
  styles: StyleTemplate;
  dependencies: DependencyTemplate[];
  examples: ExampleTemplate[];
}

export interface StateTemplate {
  name: string;
  description: string;
  ui: {
    template: string;
    styles?: string;
    interactions: InteractionTemplate[];
  };
  transitions: TransitionTemplate[];
}

export interface PropTemplate {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

export interface EventTemplate {
  name: string;
  type: string;
  payload?: any;
  description: string;
}

export interface StyleTemplate {
  framework: string;
  css: string;
  scss?: string;
  themes?: ThemeTemplate[];
}

export interface ThemeTemplate {
  name: string;
  variables: Record<string, string>;
  overrides: Record<string, string>;
}
```

#### 2. Component Generator Service

```typescript
import { Injectable } from '@angular/core';
import { ComponentTemplate, FrameworkAdapter } from '../interfaces/component-template';

@Injectable({
  providedIn: 'root'
})
export class ComponentGeneratorService {
  
  /**
   * Generate component code for a specific framework
   */
  generateComponent(template: ComponentTemplate, framework: string): string {
    const adapter = this.getFrameworkAdapter(framework);
    return adapter.generate(template);
  }

  /**
   * Generate multiple framework implementations
   */
  generateMultiFramework(template: ComponentTemplate, frameworks: string[]): Record<string, string> {
    const implementations: Record<string, string> = {};
    
    frameworks.forEach(framework => {
      implementations[framework] = this.generateComponent(template, framework);
    });
    
    return implementations;
  }

  /**
   * Generate component from existing log-view-machine
   */
  generateFromStateMachine(machine: any, framework: string): ComponentTemplate {
    const template: ComponentTemplate = {
      id: machine.machineId,
      name: machine.name || machine.machineId,
      description: machine.description || '',
      framework: framework as any,
      stateMachine: {
        id: machine.machineId,
        config: machine.xstateConfig,
        states: this.extractStates(machine)
      },
      props: this.extractProps(machine),
      events: this.extractEvents(machine),
      styles: this.extractStyles(machine),
      dependencies: this.extractDependencies(machine),
      examples: this.generateExamples(machine)
    };

    return template;
  }

  private getFrameworkAdapter(framework: string): FrameworkAdapter {
    switch (framework) {
      case 'react':
        return new ReactAdapter();
      case 'angular':
        return new AngularAdapter();
      case 'mithril':
        return new MithrilAdapter();
      case 'vue':
        return new VueAdapter();
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  private extractStates(machine: any): StateTemplate[] {
    // Extract state information from machine configuration
    const states: StateTemplate[] = [];
    
    Object.entries(machine.xstateConfig.states).forEach(([name, config]: [string, any]) => {
      states.push({
        name,
        description: config.description || `State: ${name}`,
        ui: {
          template: this.generateStateTemplate(name, config),
          interactions: this.extractInteractions(config)
        },
        transitions: this.extractTransitions(config)
      });
    });
    
    return states;
  }

  private extractProps(machine: any): PropTemplate[] {
    // Extract props from machine context and configuration
    return [
      {
        name: 'initialState',
        type: 'string',
        required: false,
        default: machine.xstateConfig.initial,
        description: 'Initial state of the machine'
      },
      {
        name: 'context',
        type: 'object',
        required: false,
        default: machine.xstateConfig.context || {},
        description: 'Initial context for the state machine'
      }
    ];
  }

  private extractEvents(machine: any): EventTemplate[] {
    // Extract events from machine configuration
    const events: EventTemplate[] = [];
    
    Object.values(machine.xstateConfig.states).forEach((state: any) => {
      if (state.on) {
        Object.entries(state.on).forEach(([eventName, eventConfig]: [string, any]) => {
          events.push({
            name: eventName,
            type: 'string',
            payload: eventConfig.payload,
            description: `Event: ${eventName}`
          });
        });
      }
    });
    
    return events;
  }

  private extractStyles(machine: any): StyleTemplate {
    return {
      framework: 'generic',
      css: this.generateDefaultStyles(machine),
      themes: [
        {
          name: 'light',
          variables: {
            '--primary-color': '#007bff',
            '--background-color': '#ffffff',
            '--text-color': '#000000'
          },
          overrides: {}
        },
        {
          name: 'dark',
          variables: {
            '--primary-color': '#0d6efd',
            '--background-color': '#212529',
            '--text-color': '#ffffff'
          },
          overrides: {}
        }
      ]
    };
  }

  private extractDependencies(machine: any): DependencyTemplate[] {
    return [
      {
        name: 'log-view-machine',
        version: '^1.3.0',
        type: 'peer'
      },
      {
        name: 'xstate',
        version: '^4.0.0',
        type: 'peer'
      }
    ];
  }

  private generateExamples(machine: any): ExampleTemplate[] {
    return [
      {
        title: 'Basic Usage',
        description: 'Basic usage example',
        code: this.generateBasicExample(machine),
        framework: 'generic'
      }
    ];
  }
}
```

#### 3. Framework Adapters

```typescript
// Angular Adapter
export class AngularAdapter implements FrameworkAdapter {
  generate(template: ComponentTemplate): string {
    return `
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewStateMachineService } from '../services/view-state-machine.service';

@Component({
  selector: 'app-${template.id}',
  template: \`
    ${this.generateAngularTemplate(template)}
  \`,
  styleUrls: ['./${template.id}.component.scss']
})
export class ${this.toPascalCase(template.id)}Component implements OnInit, OnDestroy {
  ${this.generateAngularProperties(template)}
  
  private subscription = new Subscription();

  constructor(private viewStateMachineService: ViewStateMachineService) {}

  ngOnInit(): void {
    this.viewStateMachineService.initialize({
      machineId: '${template.stateMachine.id}',
      xstateConfig: ${JSON.stringify(template.stateMachine.config, null, 6)}
    });

    this.subscription.add(
      this.viewStateMachineService.state$.subscribe(state => {
        this.currentState = state.state;
        this.context = state.context;
      })
    );
  }

  ${this.generateAngularMethods(template)}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
    `;
  }

  private generateAngularTemplate(template: ComponentTemplate): string {
    return template.stateMachine.states.map(state => `
      <div *ngIf="currentState === '${state.name}'" class="state-${state.name}">
        ${state.ui.template}
      </div>
    `).join('\n');
  }

  private generateAngularProperties(template: ComponentTemplate): string {
    return template.props.map(prop => `
  @Input() ${prop.name}: ${prop.type}${prop.default ? ` = ${JSON.stringify(prop.default)}` : ''};`).join('\n') + `
  
  currentState = 'idle';
  context: any = {};`;
  }

  private generateAngularMethods(template: ComponentTemplate): string {
    return template.events.map(event => `
  ${event.name.toLowerCase()}(): void {
    this.viewStateMachineService.send({ type: '${event.name}' });
  }`).join('\n');
  }
}

// React Adapter
export class ReactAdapter implements FrameworkAdapter {
  generate(template: ComponentTemplate): string {
    return `
import React, { useEffect, useState } from 'react';
import { createViewStateMachine } from 'log-view-machine';

const ${this.toPascalCase(template.id)}: React.FC<${this.generateReactProps(template)}> = ({
  ${template.props.map(p => p.name).join(', ')}
}) => {
  const [machine] = useState(() => createViewStateMachine({
    machineId: '${template.stateMachine.id}',
    xstateConfig: ${JSON.stringify(template.stateMachine.config, null, 6)}
  }));

  const {
    state,
    context,
    send,
    log,
    view,
    clear,
    transition
  } = machine.useViewStateMachine({
    ${Object.entries(template.stateMachine.config.context || {}).map(([key, value]) => 
      `${key}: ${JSON.stringify(value)}`
    ).join(',\n    ')}
  });

  ${this.generateReactEffects(template)}

  return (
    <div className="${template.id}">
      ${template.stateMachine.states.map(state => `
        {state === '${state.name}' && (
          <div className="state-${state.name}">
            ${state.ui.template}
          </div>
        )}`).join('\n      ')}
    </div>
  );
};

export default ${this.toPascalCase(template.id)};
    `;
  }

  private generateReactProps(template: ComponentTemplate): string {
    const props = template.props.map(prop => 
      `${prop.name}${prop.required ? '' : '?'}: ${prop.type}`
    ).join(';\n  ');
    
    return `{\n  ${props}\n}`;
  }

  private generateReactEffects(template: ComponentTemplate): string {
    return template.events.map(event => `
  const handle${this.toPascalCase(event.name)} = () => {
    send({ type: '${event.name}' });
  };`).join('\n\n');
  }
}

// Mithril Adapter
export class MithrilAdapter implements FrameworkAdapter {
  generate(template: ComponentTemplate): string {
    return `
import m from 'mithril';
import { createViewStateMachine } from 'log-view-machine';

class ${this.toPascalCase(template.id)}Component {
  constructor(vnode) {
    this.machine = createViewStateMachine({
      machineId: '${template.stateMachine.id}',
      xstateConfig: ${JSON.stringify(template.stateMachine.config, null, 6)}
    });
    
    this.machineState = this.machine.useViewStateMachine({
      ${Object.entries(template.stateMachine.config.context || {}).map(([key, value]) => 
        `${key}: ${JSON.stringify(value)}`
      ).join(',\n      ')}
    });
  }

  oninit(vnode) {
    // Initialize component
  }

  onremove(vnode) {
    // Cleanup
  }

  view(vnode) {
    const { state, context, send } = this.machineState;
    
    return m('.${template.id}', [
      ${template.stateMachine.states.map(state => `
        state === '${state.name}' ? m('.state-${state.name}', [
          ${this.generateMithrilTemplate(state.ui.template)}
        ]) : null`).join(',\n      ')}
    ]);
  }

  ${this.generateMithrilMethods(template)}
}

export default ${this.toPascalCase(template.id)}Component;
    `;
  }

  private generateMithrilTemplate(template: string): string {
    // Convert HTML template to Mithril syntax
    return template
      .replace(/<div/g, 'm(\'div\'')
      .replace(/<\/div>/g, ')')
      .replace(/<button/g, 'm(\'button\'')
      .replace(/<\/button>/g, ')')
      .replace(/class=/g, 'className=')
      .replace(/onclick=/g, 'onclick=')
      .replace(/{{/g, '${')
      .replace(/}}/g, '}');
  }

  private generateMithrilMethods(template: ComponentTemplate): string {
    return template.events.map(event => `
  ${event.name.toLowerCase()}() {
    this.machineState.send({ type: '${event.name}' });
  }`).join('\n\n');
  }
}
```

#### 4. Component Registry and Auto-Generation

```typescript
@Injectable({
  providedIn: 'root'
})
export class ComponentRegistryService {
  private registry = new Map<string, ComponentTemplate>();
  private generators = new Map<string, FrameworkAdapter>();

  constructor(private componentGenerator: ComponentGeneratorService) {
    this.initializeGenerators();
  }

  /**
   * Register a component template
   */
  registerTemplate(template: ComponentTemplate): void {
    this.registry.set(template.id, template);
  }

  /**
   * Register a state machine as a component template
   */
  registerStateMachine(machine: any, metadata: ComponentMetadata): void {
    const template = this.componentGenerator.generateFromStateMachine(machine, 'generic');
    this.registry.set(machine.machineId, { ...template, ...metadata });
  }

  /**
   * Generate all implementations for a component
   */
  generateAllImplementations(componentId: string): Record<string, string> {
    const template = this.registry.get(componentId);
    if (!template) {
      throw new Error(`Component template not found: ${componentId}`);
    }

    const frameworks = ['react', 'angular', 'mithril'];
    return this.componentGenerator.generateMultiFramework(template, frameworks);
  }

  /**
   * Generate implementation for specific framework
   */
  generateImplementation(componentId: string, framework: string): string {
    const template = this.registry.get(componentId);
    if (!template) {
      throw new Error(`Component template not found: ${componentId}`);
    }

    return this.componentGenerator.generateComponent(template, framework);
  }

  /**
   * List all registered components
   */
  listComponents(): ComponentTemplate[] {
    return Array.from(this.registry.values());
  }

  /**
   * Export component template as JSON
   */
  exportTemplate(componentId: string): string {
    const template = this.registry.get(componentId);
    if (!template) {
      throw new Error(`Component template not found: ${componentId}`);
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import component template from JSON
   */
  importTemplate(templateJson: string): void {
    const template: ComponentTemplate = JSON.parse(templateJson);
    this.registry.set(template.id, template);
  }

  private initializeGenerators(): void {
    this.generators.set('react', new ReactAdapter());
    this.generators.set('angular', new AngularAdapter());
    this.generators.set('mithril', new MithrilAdapter());
  }
}
```

#### 5. Usage Examples

```typescript
// Register an existing state machine as a component template
@Component({
  selector: 'app-component-registry',
  template: `
    <div class="component-registry">
      <h2>Component Registry</h2>
      
      <div class="registered-components">
        <h3>Registered Components</h3>
        <div *ngFor="let component of components" class="component-item">
          <h4>{{ component.name }}</h4>
          <p>{{ component.description }}</p>
          <div class="actions">
            <button (click)="generateReact(component.id)">Generate React</button>
            <button (click)="generateAngular(component.id)">Generate Angular</button>
            <button (click)="generateMithril(component.id)">Generate Mithril</button>
            <button (click)="exportTemplate(component.id)">Export Template</button>
          </div>
        </div>
      </div>
      
      <div class="generated-code" *ngIf="generatedCode">
        <h3>Generated Code</h3>
        <pre><code>{{ generatedCode }}</code></pre>
      </div>
    </div>
  `,
  styleUrls: ['./component-registry.component.scss']
})
export class ComponentRegistryComponent implements OnInit {
  components: ComponentTemplate[] = [];
  generatedCode: string = '';

  constructor(
    private componentRegistry: ComponentRegistryService,
    private viewStateMachineService: ViewStateMachineService
  ) {}

  ngOnInit(): void {
    this.components = this.componentRegistry.listComponents();
    
    // Register some example state machines as components
    this.registerExampleComponents();
  }

  private registerExampleComponents(): void {
    // Register order management component
    const orderMachine = createViewStateMachine({
      machineId: 'order-management',
      name: 'Order Management',
      description: 'Manages order lifecycle and state',
      xstateConfig: {
        initial: 'idle',
        context: { orderId: null, items: [] },
        states: {
          idle: { on: { START_ORDER: 'processing' } },
          processing: { on: { COMPLETE_ORDER: 'completed' } },
          completed: { on: { NEW_ORDER: 'idle' } }
        }
      }
    });

    this.componentRegistry.registerStateMachine(orderMachine, {
      name: 'Order Management Component',
      description: 'A reusable order management component',
      category: 'e-commerce',
      tags: ['order', 'shopping', 'cart']
    });

    // Register user authentication component
    const authMachine = createViewStateMachine({
      machineId: 'user-auth',
      name: 'User Authentication',
      description: 'Handles user login/logout flow',
      xstateConfig: {
        initial: 'loggedOut',
        context: { user: null },
        states: {
          loggedOut: { on: { LOGIN: 'loggingIn' } },
          loggingIn: { on: { LOGIN_SUCCESS: 'loggedIn', LOGIN_FAILED: 'loggedOut' } },
          loggedIn: { on: { LOGOUT: 'loggedOut' } }
        }
      }
    });

    this.componentRegistry.registerStateMachine(authMachine, {
      name: 'User Authentication Component',
      description: 'A reusable authentication component',
      category: 'authentication',
      tags: ['auth', 'login', 'user']
    });

    this.components = this.componentRegistry.listComponents();
  }

  generateReact(componentId: string): void {
    this.generatedCode = this.componentRegistry.generateImplementation(componentId, 'react');
  }

  generateAngular(componentId: string): void {
    this.generatedCode = this.componentRegistry.generateImplementation(componentId, 'angular');
  }

  generateMithril(componentId: string): void {
    this.generatedCode = this.componentRegistry.generateImplementation(componentId, 'mithril');
  }

  exportTemplate(componentId: string): void {
    const template = this.componentRegistry.exportTemplate(componentId);
    // In a real app, you might download this as a file
    console.log('Exported template:', template);
    this.generatedCode = template;
  }
}
```

### Benefits of Component Templating

1. **Framework Agnostic**: Write once, generate for multiple frameworks
2. **Consistent Behavior**: Same state machine logic across all implementations
3. **Rapid Prototyping**: Quickly generate components from state machine definitions
4. **Maintenance**: Update state machine logic and regenerate all framework implementations
5. **Team Collaboration**: Share component specifications across different framework teams
6. **Documentation**: Auto-generated examples and documentation for each framework

### Best Practices for Component Templating

1. **Design State Machines First**: Focus on the state logic before UI implementation
2. **Keep Templates Generic**: Avoid framework-specific code in templates
3. **Version Control**: Track template versions and changes
4. **Testing**: Test generated components across all target frameworks
5. **Documentation**: Maintain comprehensive documentation for each template
6. **Validation**: Validate generated code before deployment

## Framework Comparison

| Feature | React Hooks | Angular Services | Mithril Components |
|---------|-------------|------------------|-------------------|
| State Management | `useState`, `useEffect` | RxJS Observables | Mithril Streams |
| Context Injection | `TomeContext` | `TomeContextComponent` | Context Mixins |
| Service Integration | Custom Hooks | Injectable Services | Mithril Components |
| Reactive Updates | Automatic Re-renders | Observable Subscriptions | Stream Updates |
| Lifecycle Management | `useEffect` | `OnInit`, `OnDestroy` | `oninit`, `onremove` |
| Dependency Injection | Manual Props/Context | Angular DI | Manual Injection |
| Testing | React Testing Library | Angular Testing Utils | Mithril Testing |
| Component Templating | Auto-generated Hooks | Auto-generated Services | Auto-generated Components |

The Angular implementation provides the same powerful state management capabilities as React while leveraging Angular's robust dependency injection system and reactive programming model with RxJS observables. The component templating system enables seamless code generation across multiple frameworks from a single state machine definition.
