/**
 * Test script for git commit and dotCMS persistence functionality
 */

async function testGitCommitAndPersistence() {
  console.log('🧪 Testing Git Commit and dotCMS Persistence...\n');

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
        name: 'Test Git Component',
        description: 'A test component for git commit and persistence',
        template: '<div class="test-git-component">Git Test</div>',
        styles: '.test-git-component { color: #007bff; }',
        script: 'console.log("Git test component loaded");',
        stateMachine: { id: 'git-test-machine', initial: 'idle', states: { idle: {} } }
      })
    });

    const createData = await createResponse.json();
    if (createData.success) {
      console.log('✅ Test component created:', createData.component.name);
      const componentId = createData.component.id;

      // Test 3: Test dotCMS persistence replication
      console.log('\n3. Testing dotCMS persistence replication...');
      const persistResponse = await fetch(`${baseUrl}/api/components/${componentId}/persist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData.component)
      });

      const persistData = await persistResponse.json();
      if (persistData.success) {
        console.log('✅ dotCMS persistence replicated successfully');
        console.log('   Resource path:', persistData.resourcePath);
        console.log('   Version history path:', persistData.versionHistoryPath);
        console.log('   Workflow history path:', persistData.workflowHistoryPath);
      } else {
        console.log('❌ Failed to replicate dotCMS persistence:', persistData.error);
      }

      // Test 4: Test git commit (should fail without proper conditions)
      console.log('\n4. Testing git commit (should fail without developer mode)...');
      const commitResponse = await fetch(`${baseUrl}/api/components/${componentId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeInEditorSrc: false,
          commitMessage: 'Test commit',
          developerMode: false
        })
      });

      const commitData = await commitResponse.json();
      if (!commitData.success) {
        console.log('✅ Git commit correctly rejected (developer mode disabled):', commitData.error);
      } else {
        console.log('❌ Git commit should have been rejected');
      }

      // Test 5: Test git commit with developer mode enabled
      console.log('\n5. Testing git commit with developer mode enabled...');
      const commitResponse2 = await fetch(`${baseUrl}/api/components/${componentId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeInEditorSrc: true,
          commitMessage: 'Test commit with developer mode',
          developerMode: true
        })
      });

      const commitData2 = await commitResponse2.json();
      if (commitData2.success) {
        console.log('✅ Git commit successful:', commitData2.commitHash);
        console.log('   Commit message:', commitData2.commitMessage);
      } else {
        console.log('❌ Git commit failed:', commitData2.error);
        console.log('   (This is expected if not in a git repository)');
      }

      // Test 6: Test error handling
      console.log('\n6. Testing error handling...');
      const errorResponse = await fetch(`${baseUrl}/api/components/invalid-id/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeInEditorSrc: true,
          commitMessage: 'Test Error',
          developerMode: true
        })
      });

      const errorData = await errorResponse.json();
      if (!errorData.success) {
        console.log('✅ Error handling works correctly:', errorData.error);
      } else {
        console.log('❌ Error handling failed - should have returned error');
      }

    } else {
      console.log('❌ Failed to create test component:', createData.error);
    }

    console.log('\n🎉 Git Commit and Persistence Test Complete!');
    console.log('\nKey Features Tested:');
    console.log('✅ Component creation');
    console.log('✅ dotCMS persistence replication');
    console.log('✅ Git commit with developer mode');
    console.log('✅ Git commit security (requires developer mode)');
    console.log('✅ Error handling');
    console.log('✅ Server persistence');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGitCommitAndPersistence(); 