/** @jsxImportSource react */
import { useState } from 'react';
import type { ParseResponse } from './types';
import { ImportPage } from './pages/ImportPage';
import { PreviewPage } from './pages/PreviewPage';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';

type Route =
  | { page: 'import' }
  | { page: 'preview'; result: ParseResponse }
  | { page: 'tasks' }
  | { page: 'detail'; taskId: string };

export function TodoApp() {
  const [route, setRoute] = useState<Route>({ page: 'import' });

  function goImport() { setRoute({ page: 'import' }); }
  function goTasks() { setRoute({ page: 'tasks' }); }

  if (route.page === 'import') {
    return (
      <ImportPage
        onParsed={(result) => setRoute({ page: 'preview', result })}
        onGoToTasks={goTasks}
      />
    );
  }

  if (route.page === 'preview') {
    return (
      <PreviewPage
        result={route.result}
        onConfirmed={goTasks}
        onBack={goImport}
      />
    );
  }

  if (route.page === 'tasks') {
    return (
      <TasksPage
        onTaskClick={(id) => setRoute({ page: 'detail', taskId: id })}
        onNewImport={goImport}
      />
    );
  }

  if (route.page === 'detail') {
    return (
      <TaskDetailPage
        taskId={route.taskId}
        onBack={goTasks}
        onNewImport={goImport}
      />
    );
  }

  return null;
}
