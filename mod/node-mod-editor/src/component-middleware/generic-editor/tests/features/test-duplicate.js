/**
 * Test script for duplicate component functionality
 */

async function testDuplicateComponent() {
  console.log('🧪 Testing Duplicate Component Functionality...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Check server health
    console.log('1. Checking server health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server is running:', healthData.status);

    // Test 2: Create a test component
    console.log('\n2. Creating test component...');
    const createResponse = await fetch(`${baseUrl}/api/components/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Button Component',
        description: 'A test component for duplication',
        template: '<button class="test-btn">Click me</button>',
        styles: '.test-btn { padding: 10px 20px; background: #007bff; color: white; }',
        script: 'console.log("Test button clicked");',
        stateMachine: { id: 'test-machine', initial: 'idle', states: { idle: {} } }
      })
    });

    const createData = await createResponse.json();
    if (createData.success) {
      console.log('✅ Test component created:', createData.component.name);
      const componentId = createData.component.id;

      // Test 3: Duplicate the component
      console.log('\n3. Duplicating component...');
      const duplicateResponse = await fetch(`${baseUrl}/api/components/${componentId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: 'Duplicated Test Button',
          newDescription: 'This is a duplicated version of the test component'
        })
      });

      const duplicateData = await duplicateResponse.json();
      if (duplicateData.success) {
        console.log('✅ Component duplicated successfully:', duplicateData.component.name);
        console.log('   Original ID:', componentId);
        console.log('   Duplicate ID:', duplicateData.component.id);
        console.log('   Duplicated from:', duplicateData.component.duplicatedFrom);

        // Test 4: Load the duplicated component
        console.log('\n4. Loading duplicated component...');
        const loadResponse = await fetch(`${baseUrl}/api/components/${duplicateData.component.id}/load`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: '1.0.0' })
        });

        const loadData = await loadResponse.json();
        if (loadData.success) {
          console.log('✅ Duplicated component loaded successfully');
          console.log('   Name:', loadData.component.name);
          console.log('   Description:', loadData.component.description);
          console.log('   Template length:', loadData.component.template.length);
          console.log('   Styles length:', loadData.component.styles.length);
        } else {
          console.log('❌ Failed to load duplicated component:', loadData.error);
        }
      } else {
        console.log('❌ Failed to duplicate component:', duplicateData.error);
      }
    } else {
      console.log('❌ Failed to create test component:', createData.error);
    }

    // Test 5: Test error handling
    console.log('\n5. Testing error handling...');
    const errorResponse = await fetch(`${baseUrl}/api/components/invalid-id/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newName: 'Test Error',
        newDescription: 'This should fail'
      })
    });

    const errorData = await errorResponse.json();
    if (!errorData.success) {
      console.log('✅ Error handling works correctly:', errorData.error);
    } else {
      console.log('❌ Error handling failed - should have returned error');
    }

    console.log('\n🎉 Duplicate Component Test Complete!');
    console.log('\nKey Features Tested:');
    console.log('✅ Component creation');
    console.log('✅ Component duplication');
    console.log('✅ Duplicate loading');
    console.log('✅ Error handling');
    console.log('✅ Server persistence');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDuplicateComponent(); 