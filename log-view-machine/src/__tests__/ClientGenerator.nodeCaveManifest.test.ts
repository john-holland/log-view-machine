import { ClientGenerator, parseNodeCaveMachineManifest } from '../index';

describe('ClientGenerator Node Cave manifest', () => {
  it('parseNodeCaveMachineManifest accepts saurce-style document', () => {
    const doc = {
      service: 'saurce',
      schema_version: 'lvm2.node_cave_manifest/1',
      machines: [
        {
          id: 'saurce:walletLedger',
          prefixes: ['wallet/'],
          structural_routes: ['wallet/balance'],
          xstate_states: ['idle', 'done'],
          xstate_events: ['ROUTE'],
        },
      ],
    };
    const parsed = parseNodeCaveMachineManifest(doc);
    expect(parsed?.service).toBe('saurce');
    expect(parsed?.machines[0].id).toBe('saurce:walletLedger');
  });

  it('ingestNodeCaveManifest surfaces rows in discover()', () => {
    const gen = new ClientGenerator();
    gen.ingestNodeCaveManifest({
      service: 'resaurce',
      machines: [{ id: 'resaurce:hrHelp', prefixes: ['hr/'], structural_routes: ['hr/help/session'] }],
    });
    const d = gen.discover();
    expect(d.nodeCaveMachines?.length).toBe(1);
    expect(d.nodeCaveMachines?.[0].machineId).toBe('resaurce:hrHelp');
    expect(d.documentation).toContain('Node Cave manifests');
  });
});
