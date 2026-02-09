import React, { useState, useEffect } from 'react';
import { createTomeConnector } from 'log-view-machine';
import type { TomeInstance } from 'log-view-machine';

interface ConnectionsScreenProps {
  tome: TomeInstance | null;
}

const orderMachineInitial = {
  orderId: null,
  items: [] as any[],
  total: 0,
  status: 'pending',
};
const paymentMachineInitial = {
  orderId: null,
  amount: 0,
  paymentMethod: null,
  status: 'waiting',
};
const inventoryMachineInitial = {
  items: [] as any[],
  lowStock: [] as any[],
  status: 'available',
};

function ConnectionsScreenWithTome({ tome }: { tome: TomeInstance }) {
  const orderMachine = tome.getMachine('order');
  const paymentMachine = tome.getMachine('payment');
  const inventoryMachine = tome.getMachine('inventory');

  const [tomeConnector] = useState(() => createTomeConnector());
  const [connections, setConnections] = useState<string[]>([]);
  const [networkTopology, setNetworkTopology] = useState<any>(null);
  const [validation, setValidation] = useState<{ warnings: string[]; errors: string[] }>({
    warnings: [],
    errors: [],
  });

  const orderState = orderMachine.useViewStateMachine(orderMachineInitial);

  const paymentState = paymentMachine.useViewStateMachine(paymentMachineInitial);

  const inventoryState = inventoryMachine.useViewStateMachine(inventoryMachineInitial);

  useEffect(() => {
    const orderToPayment = tomeConnector.connect(orderMachine, paymentMachine, {
      eventMapping: {
        COMPLETE_ORDER: 'ORDER_READY',
        ADD_ITEM: 'ITEM_ADDED',
      },
      stateMapping: {
        orderId: 'orderId',
        total: 'amount',
      },
      bidirectional: true,
      filters: {
        events: ['COMPLETE_ORDER', 'ADD_ITEM', 'ORDER_READY', 'ITEM_ADDED'],
      },
    });

    const orderToInventory = tomeConnector.connect(orderMachine, inventoryMachine, {
      eventMapping: {
        ADD_ITEM: 'ITEM_ADDED',
        COMPLETE_ORDER: 'ITEM_REMOVED',
      },
      stateMapping: {
        items: 'items',
      },
      bidirectional: false,
    });

    const paymentToInventory = tomeConnector.connect(paymentMachine, inventoryMachine, {
      eventMapping: {
        PAYMENT_SUCCESS: 'ITEM_REMOVED',
        PAYMENT_FAILED: 'ITEM_ADDED',
      },
      bidirectional: true,
    });

    setConnections([orderToPayment, orderToInventory, paymentToInventory]);
    setNetworkTopology(tomeConnector.getNetworkTopology());
    setValidation(tomeConnector.validateNetwork());

    return () => {
      [orderToPayment, orderToInventory, paymentToInventory].forEach((id) => {
        tomeConnector.disconnect(id);
      });
    };
  }, []);

  const handleOrderAction = (action: string) => {
    orderState.send({ type: action });
  };

  const handlePaymentAction = (action: string) => {
    paymentState.send({ type: action });
  };

  const handleInventoryAction = (action: string) => {
    inventoryState.send({ type: action });
  };

  const broadcastEvent = (event: any) => {
    tomeConnector.broadcastEvent(event, orderMachine);
  };

  return (
    <div className="tome-connection-example">
      <div className="header">
        <h2>🔄 Tome Connection Example</h2>
        <p>Demonstrates dynamic connections between ViewStateMachines with bidirectional state and event flow</p>
      </div>

      <div className="network-info">
        <h3>Network Topology</h3>
        <div className="topology">
          <h4>Nodes:</h4>
          <ul>
            {networkTopology?.nodes.map((node: string) => (
              <li key={node}>{node}</li>
            ))}
          </ul>
          <h4>Connections:</h4>
          <ul>
            {networkTopology?.edges.map((edge: any) => (
              <li key={edge.id}>
                {edge.from} ↔ {edge.to}
                {edge.bidirectional ? ' (bidirectional)' : ' (unidirectional)'}
              </li>
            ))}
          </ul>
        </div>

        <div className="validation">
          <h4>Network Validation:</h4>
          {validation.errors.length > 0 && (
            <div className="errors">
              <h5>Errors:</h5>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index} className="error">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="warnings">
              <h5>Warnings:</h5>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="warning">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="machines">
        <div className="machine-section">
          <h3>📦 Order Machine</h3>
          <div className="machine-controls">
            <button onClick={() => handleOrderAction('START_ORDER')}>Start Order</button>
            <button onClick={() => handleOrderAction('ADD_ITEM')}>Add Item</button>
            <button onClick={() => handleOrderAction('COMPLETE_ORDER')}>Complete Order</button>
            <button onClick={() => handleOrderAction('RESET')}>Reset</button>
          </div>
          <div className="machine-view">
            {orderState.viewStack.length > 0 && orderState.viewStack[orderState.viewStack.length - 1]}
          </div>
        </div>

        <div className="machine-section">
          <h3>💳 Payment Machine</h3>
          <div className="machine-controls">
            <button onClick={() => handlePaymentAction('PAYMENT_SUCCESS')}>Simulate Success</button>
            <button onClick={() => handlePaymentAction('PAYMENT_FAILED')}>Simulate Failure</button>
            <button onClick={() => handlePaymentAction('RESET')}>Reset</button>
          </div>
          <div className="machine-view">
            {paymentState.viewStack.length > 0 && paymentState.viewStack[paymentState.viewStack.length - 1]}
          </div>
        </div>

        <div className="machine-section">
          <h3>📊 Inventory Machine</h3>
          <div className="machine-controls">
            <button onClick={() => handleInventoryAction('ITEM_ADDED')}>Add Item</button>
            <button onClick={() => handleInventoryAction('ITEM_REMOVED')}>Remove Item</button>
            <button onClick={() => handleInventoryAction('RESTOCKED')}>Restock</button>
          </div>
          <div className="machine-view">
            {inventoryState.viewStack.length > 0 && inventoryState.viewStack[inventoryState.viewStack.length - 1]}
          </div>
        </div>
      </div>

      <div className="broadcast-section">
        <h3>📡 Broadcast Events</h3>
        <div className="broadcast-controls">
          <button onClick={() => broadcastEvent({ type: 'GLOBAL_RESET' })}>Broadcast Reset</button>
          <button onClick={() => broadcastEvent({ type: 'SYSTEM_MAINTENANCE' })}>Broadcast Maintenance</button>
        </div>
      </div>

      <style>{`
        .tome-connection-example { padding: 20px; max-width: 1400px; margin: 0 auto; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .network-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .topology { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .validation { margin-top: 15px; }
        .errors { background: #ffebee; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .warnings { background: #fff3e0; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .machines { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .machine-section { background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .machine-controls { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px; }
        .machine-controls button { padding: 8px 12px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; font-size: 12px; }
        .machine-view { background: white; padding: 10px; border-radius: 4px; min-height: 100px; }
        .broadcast-section { background: #e8f5e8; padding: 15px; border-radius: 8px; }
        .broadcast-controls { display: flex; gap: 10px; margin-top: 10px; }
        .broadcast-controls button { padding: 10px 15px; border: none; border-radius: 4px; background: #4caf50; color: white; cursor: pointer; }
        .order-machine, .payment-machine, .inventory-machine { text-align: center; }
        .order-machine button, .payment-machine button, .inventory-machine button { margin: 5px; padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; }
      `}</style>
    </div>
  );
};

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ tome }) => {
  if (!tome) return <div>Loading...</div>;
  return <ConnectionsScreenWithTome tome={tome} />;
};

export default ConnectionsScreen;
