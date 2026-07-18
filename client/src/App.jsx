import { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import AiInsights from "./components/AiInsights";
import MeetingsTab from "./components/tabs/MeetingsTab";
import TasksTab from "./components/tabs/TasksTab";
import ExpensesTab from "./components/tabs/ExpensesTab";
import WorkoutsTab from "./components/tabs/WorkoutsTab";
import NotesTab from "./components/tabs/NotesTab";
import StudyTab from "./components/tabs/StudyTab";
import HealthTab from "./components/tabs/HealthTab";
import HabitsTab from "./components/tabs/HabitsTab";
import { sendMessage, getMe, logout, getToken, fetchActivities, saveActivity, updateActivity, deleteActivityById } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("lifepilot_tab") || "meetings");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("lifepilot_tab", tab);
  };

  const [activities, setActivities] = useState({
    meetings: [],
    tasks: [],
    expenses: [],
    workouts: [],
    notes: [],
    habits: [],
    health: [],
    study: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [clarification, setClarification] = useState(null);
  const [sidebarPrefs, setSidebarPrefs] = useState({ favorites: [], tabOrder: null, id: null });

  // Check if user has a valid token on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const userData = await getMe();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Load activities from DB when user is authenticated
  useEffect(() => {
    if (!user) return;
    const loadActivities = async () => {
      try {
        const all = await fetchActivities();
        const grouped = { meetings: [], tasks: [], expenses: [], workouts: [], notes: [], habits: [], health: [], study: [] };
        const tabMap = { calendar_event: "meetings", task: "tasks", expense: "expenses", workout: "workouts", note: "notes", habit: "habits", health: "health", study: "study" };
        all.forEach((a) => {
          // Extract sidebar prefs
          if (a.type === "preference" && a.payload?.subtype === "sidebar") {
            setSidebarPrefs({ favorites: a.payload.favorites || [], tabOrder: a.payload.tabOrder || null, id: a.id });
            return;
          }
          const tab = tabMap[a.type] || "notes";
          if (grouped[tab]) grouped[tab].push(a);
        });
        setActivities(grouped);
      } catch (err) {
        console.error("Failed to load activities:", err);
      }
    };
    loadActivities();
  }, [user]);

  const handleSend = async (text) => {
    setIsLoading(true);
    try {
      const context = clarification?.partial || null;
      const result = await sendMessage(text, context);

      if (result.type === "clarification") {
        setClarification({ message: result.message, partial: result.partial });
        setIsLoading(false);
        return;
      }

      setClarification(null);

      if (result.actions) {
        for (let i = 0; i < result.actions.length; i++) {
          const action = result.actions[i];
          const enrichedAction = {
            type: action.type,
            effectiveDate: action.effectiveDate,
            payload: action.payload,
            executionResult: result.executed ? result.results?.[i] || null : null,
          };

          // Save to database
          const saved = await saveActivity(enrichedAction);

          const tabMap = { calendar_event: "meetings", task: "tasks", expense: "expenses", workout: "workouts", note: "notes", habit: "habits", health: "health", study: "study" };
          const tab = tabMap[action.type] || "notes";

          setActivities((prev) => ({
            ...prev,
            [tab]: [saved, ...prev[tab]],
          }));
        }
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="flex" style={{ gap: '6px' }}>
          <span className="typing-dot w-3 h-3 bg-primary rounded-full" />
          <span className="typing-dot w-3 h-3 bg-primary rounded-full" />
          <span className="typing-dot w-3 h-3 bg-primary rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  const handleSidebarPrefsChange = async (newFavorites, newTabOrder) => {
    const payload = { subtype: "sidebar", favorites: newFavorites, tabOrder: newTabOrder };
    if (sidebarPrefs.id) {
      await updateActivity(sidebarPrefs.id, { payload });
      setSidebarPrefs((p) => ({ ...p, favorites: newFavorites, tabOrder: newTabOrder }));
    } else {
      const saved = await saveActivity({ type: "preference", effectiveDate: new Date().toISOString().split("T")[0], payload });
      setSidebarPrefs({ favorites: newFavorites, tabOrder: newTabOrder, id: saved.id });
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setActivities({ meetings: [], tasks: [], expenses: [], workouts: [], notes: [], habits: [], health: [], study: [] });
  };

  const makeSetterFor = (key) => (fn) =>
    setActivities((prev) => ({
      ...prev,
      [key]: typeof fn === "function" ? fn(prev[key]) : fn,
    }));

  // CRUD helpers that sync with both local state and API
  const activityHandlers = {
    add: async (tab, activity) => {
      const saved = await saveActivity(activity);
      setActivities((prev) => ({ ...prev, [tab]: [saved, ...prev[tab]] }));
      return saved;
    },
    update: async (tab, id, updates) => {
      await updateActivity(id, updates);
      setActivities((prev) => ({
        ...prev,
        [tab]: prev[tab].map((a) => (a.id === id ? { ...a, ...updates, payload: updates.payload || a.payload } : a)),
      }));
    },
    remove: async (tab, id) => {
      await deleteActivityById(id);
      setActivities((prev) => ({ ...prev, [tab]: prev[tab].filter((a) => a.id !== id) }));
    },
  };

  const renderTab = () => {
    const common = { onSend: handleSend, isLoading, clarification, onAdd: activityHandlers.add, onUpdate: activityHandlers.update, onRemove: activityHandlers.remove };
    switch (activeTab) {
      case "meetings":
        return <MeetingsTab meetings={activities.meetings} setMeetings={makeSetterFor("meetings")} {...common} />;
      case "tasks":
        return <TasksTab tasks={activities.tasks} setTasks={makeSetterFor("tasks")} {...common} />;
      case "expenses":
        return <ExpensesTab expenses={activities.expenses} setExpenses={makeSetterFor("expenses")} {...common} />;
      case "workouts":
        return <WorkoutsTab workouts={activities.workouts} setWorkouts={makeSetterFor("workouts")} {...common} />;
      case "notes":
        return <NotesTab notes={activities.notes} setNotes={makeSetterFor("notes")} {...common} />;
      case "habits":
        return <HabitsTab habits={activities.habits} setHabits={makeSetterFor("habits")} {...common} />;
      case "health":
        return <HealthTab health={activities.health} setHealth={makeSetterFor("health")} {...common} />;
      case "study":
        return <StudyTab studies={activities.study} setStudies={makeSetterFor("study")} {...common} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-surface">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} user={user} onLogout={handleLogout} onUpdateUser={setUser} sidebarPrefs={sidebarPrefs} onPrefsChange={handleSidebarPrefsChange} />
      {renderTab()}
      <AiInsights />
    </div>
  );
}

export default App;
