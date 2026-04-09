'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [workspaceNameEdit, setWorkspaceNameEdit] = useState('');
  const [workspaceDescriptionEdit, setWorkspaceDescriptionEdit] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchWorkspaces();
  }, [session, status, router]);

  useEffect(() => {
    if (workspaceDetails) {
      setWorkspaceNameEdit(workspaceDetails.name || '');
      setWorkspaceDescriptionEdit(workspaceDetails.description || '');
    }
  }, [workspaceDetails]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const fetchWorkspaceDetails = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error('Failed to load workspace details');
      const data = await res.json();
      setWorkspaceDetails(data);
      setWorkspaceNameEdit(data.name || '');
      setWorkspaceDescriptionEdit(data.description || '');
    } catch (error) {
      console.error('Failed to fetch workspace details:', error);
    }
  };

  const fetchProjects = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setWorkspaceProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setWorkspaceProjects([]);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to create workspace');
      }

      const newWorkspace = await res.json();
      setWorkspaces([...workspaces, newWorkspace]);
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setSelectedWorkspace(newWorkspace);
      fetchWorkspaceDetails(newWorkspace._id);
      fetchProjects(newWorkspace._id);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      setErrorMessage('Could not create workspace.');
    }
    setLoading(false);
  };

  const handleWorkspaceClick = async (workspace: any) => {
    setSelectedWorkspace(workspace);
    setAnalysisText('');
    setReportText('');
    setSelectedProject(null);
    await fetchWorkspaceDetails(workspace._id);
    await fetchProjects(workspace._id);
  };

  const handleAddMember = async () => {
    if (!selectedWorkspace || !newMemberEmail.trim()) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to add member');
      }

      const updatedWorkspace = await res.json();
      setWorkspaceDetails(updatedWorkspace);
      setSelectedWorkspace(updatedWorkspace);
      setWorkspaces((current) =>
        current.map((ws) => (ws._id === updatedWorkspace._id ? updatedWorkspace : ws))
      );
      setNewMemberEmail('');
    } catch (error) {
      console.error('Failed to add member:', error);
      setErrorMessage('Could not add member.');
    }
    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!selectedWorkspace || !newProjectName.trim()) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace._id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to create project');
      }

      const project = await res.json();
      setWorkspaceProjects((current) => [...current, project]);
      setSelectedProject(project);
      setNewProjectName('');
      await fetchProjects(selectedWorkspace._id);
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrorMessage('Could not create project.');
    }
    setLoading(false);
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setAnalysisText('');
    setReportText('');
  };

  const handleUpdateWorkspace = async () => {
    if (!selectedWorkspace) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceNameEdit.trim(), description: workspaceDescriptionEdit.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to update workspace');
      }

      const updatedWorkspace = await res.json();
      setWorkspaceDetails(updatedWorkspace);
      setSelectedWorkspace(updatedWorkspace);
      setErrorMessage('Workspace saved successfully.');
    } catch (error) {
      console.error('Failed to update workspace:', error);
      setErrorMessage('Could not update workspace settings.');
    }
    setLoading(false);
  };

  const handleGenerateInsights = async () => {
    if (!selectedProject) return;

    setLoadingInsights(true);
    setAnalysisText('');
    try {
      const res = await fetch('/api/ai/catchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject._id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to generate insights');
      }

      const { summary } = await res.json();
      setAnalysisText(summary);
    } catch (error) {
      console.error('Insight generation failed:', error);
      setAnalysisText('Could not generate insights.');
    }
    setLoadingInsights(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedProject) return;

    setLoadingReport(true);
    setReportText('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject._id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Failed to generate report');
      }

      const { summary } = await res.json();
      setReportText(summary);
    } catch (error) {
      console.error('Report generation failed:', error);
      setReportText('Could not generate report.');
    }
    setLoadingReport(false);
  };

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!session) return null;

  const userRole = session.user?.role || 'analyst';
  const isManager = userRole === 'manager';
  const isAnalyst = userRole === 'analyst';
  const isDesigner = userRole === 'designer';
  const currentWorkspace = workspaceDetails || selectedWorkspace;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-72 shrink-0 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Workspaces</h2>
        {workspaces.length === 0 ? (
          <div className="text-sm text-gray-600">No workspaces yet. Create one to start collaborating.</div>
        ) : (
          <ul className="space-y-2">
            {workspaces.map((ws: any) => (
              <li
                key={ws._id}
                onClick={() => handleWorkspaceClick(ws)}
                className={`p-3 rounded-2xl cursor-pointer transition-colors ${
                  selectedWorkspace?._id === ws._id
                    ? 'bg-indigo-100 border border-indigo-300 text-gray-900'
                    : 'bg-slate-100 hover:bg-slate-200 text-gray-900'
                }`}
              >
                <div className="font-medium text-gray-900">{ws.name}</div>
                <div className="text-xs text-gray-600">{ws.members?.length || 0} members • Owner: {ws.owner?.username || 'Unknown'}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-2xl hover:bg-indigo-700 transition"
          >
            Create Workspace
          </button>
          {currentWorkspace && (
            <button
              onClick={() => document.getElementById('workspace-manage-top')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-700 transition"
            >
              Manage Workspace
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Account</h3>
          <button
            onClick={() => router.push('/accounts')}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-2xl transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account Settings
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
              <h1 className="mt-3 text-4xl font-bold text-gray-900">Welcome back, {session.user?.username || session.user?.email}!</h1>
              <p className="mt-3 text-gray-600 max-w-2xl">
                {isManager
                  ? 'Manage your team, review workspaces, and assign tasks.'
                  : isAnalyst
                    ? 'Analyze data, surface insights, and make recommendations.'
                    : 'Build beautiful experiences, share visual progress, and iterate quickly.'}
              </p>
            </div>
            {currentWorkspace && (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active workspace</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">{currentWorkspace.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{currentWorkspace.description || 'No workspace description yet.'}</p>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Workspace count</h3>
            <p className="mt-4 text-4xl font-bold text-indigo-600">{workspaces.length}</p>
          </div>
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Role summary</h3>
            <p className="text-sm text-slate-600">
              {isManager
                ? 'Organize your team and keep strategic priorities aligned.'
                : isAnalyst
                  ? 'Generate insights and bring clarity to the latest work.'
                  : 'Lead design collaboration with clear visual context.'}
            </p>
          </div>
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Project health</h3>
            <p className="text-sm text-slate-600">{selectedProject ? `${selectedProject.name} is ready for reporting.` : 'Select a project to start insights and reports.'}</p>
          </div>
        </div>

        {currentWorkspace && (
          <section id="workspace-manage-top" className="grid gap-6 xl:grid-cols-[2fr_1fr] mb-8">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Workspace management</h2>
                    <p className="text-sm text-slate-600">Invite members, create projects, and keep your workspace organized.</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Invite a teammate</p>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="member@example.com"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleAddMember}
                        className="rounded-2xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Create a project</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleCreateProject}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 transition"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Configure settings</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Workspace name</label>
                      <input
                        type="text"
                        value={workspaceNameEdit}
                        onChange={(e) => setWorkspaceNameEdit(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        value={workspaceDescriptionEdit}
                        onChange={(e) => setWorkspaceDescriptionEdit(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                        placeholder="Describe this workspace"
                      />
                    </div>
                    <button
                      onClick={handleUpdateWorkspace}
                      className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 transition"
                    >
                      Save settings
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Team members</h3>
                <div className="space-y-3">
                  {(workspaceDetails?.members || currentWorkspace.members || []).map((member: any) => (
                    <div key={member._id || member.email} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{member.username || member.email}</p>
                      <p className="text-sm text-slate-500">{member.email || 'No email available'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Projects</h3>
                <div className="space-y-3">
                  {workspaceProjects.length === 0 ? (
                    <p className="text-sm text-slate-600">No projects created yet. Use the button above to add one.</p>
                  ) : (
                    workspaceProjects.map((project: any) => (
                      <button
                        key={project._id}
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${selectedProject?._id === project._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{project.name}</p>
                            <p className="text-sm text-slate-500">{project.members?.length || 0} members</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Project</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {selectedProject && (
                  <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Selected project</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedProject.name}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleGenerateInsights}
                        className="rounded-2xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 transition"
                      >
                        Generate Insights
                      </button>
                      <button
                        onClick={handleGenerateReport}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition"
                      >
                        Generate Report
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Analytics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-indigo-50 p-5">
                    <p className="text-sm text-slate-500">Workspace members</p>
                    <p className="mt-3 text-3xl font-semibold text-indigo-700">{(workspaceDetails?.members || currentWorkspace.members || []).length}</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-5">
                    <p className="text-sm text-slate-500">Projects</p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-700">{workspaceProjects.length}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Selected project</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{selectedProject ? selectedProject.name : 'None'}</p>
                  </div>
                  <div className="rounded-3xl bg-purple-50 p-5">
                    <p className="text-sm text-slate-500">Insights ready</p>
                    <p className="mt-3 text-3xl font-semibold text-purple-700">{selectedProject && analysisText ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentWorkspace && (
          <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Insights & reports</h2>
                <p className="text-sm text-slate-600">Generate AI summaries and reports for your selected project.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Insights</h3>
                <div className="min-h-[180px] rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                  {loadingInsights ? (
                    <p>Generating insights…</p>
                  ) : analysisText ? (
                    <pre className="whitespace-pre-wrap">{analysisText}</pre>
                  ) : (
                    <p>{selectedProject ? 'Click Generate Insights to get a project briefing.' : 'Select a project to activate insights.'}</p>
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Report</h3>
                <div className="min-h-[180px] rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                  {loadingReport ? (
                    <p>Generating report…</p>
                  ) : reportText ? (
                    <pre className="whitespace-pre-wrap">{reportText}</pre>
                  ) : (
                    <p>{selectedProject ? 'Click Generate Report to produce a summary.' : 'Select a project to activate reporting.'}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Create New Workspace</h3>
            <p className="text-slate-600 mb-6">Create a new workspace to start collaborating with your team.</p>
            <div className="mb-6">
              <label htmlFor="workspaceName" className="block text-sm font-medium text-slate-700 mb-2">Workspace Name</label>
              <input
                id="workspaceName"
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={loading || !newWorkspaceName.trim()}
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
