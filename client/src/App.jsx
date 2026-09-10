import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import DeveloperProfile from "./pages/DeveloperProfile";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import EditProject from "./pages/EditProject";
import Invitations from "./pages/Invitations";
import ProjectMembers from "./pages/ProjectMembers";
import ProjectDetails from "./pages/ProjectDetails";
import Discussions from "./pages/Discussions";
import CreateDiscussion from "./pages/CreateDiscussion";
import DiscussionDetails from "./pages/DiscussionDetails";
import Notifications from "./pages/Notifications";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
  path="/projects/create"
  element={
    <ProtectedRoute>
      <CreateProject />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects/:projectId/members"
  element={
    <ProtectedRoute>
      <ProjectMembers />
    </ProtectedRoute>
  }
/>

        <Route
  path="/projects"
  element={
    <ProtectedRoute>
      <Projects />
    </ProtectedRoute>
  }
/>
        <Route
  path="/developers/:id"
  element={
    <ProtectedRoute>
      <DeveloperProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/invitations"
  element={
    <ProtectedRoute>
      <Invitations />
    </ProtectedRoute>
  }
/>


<Route
  path="/projects/edit/:id"
  element={
    <ProtectedRoute>
      <EditProject />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects/:projectId"
  element={
    <ProtectedRoute>
      <ProjectDetails />
    </ProtectedRoute>
  }
/>

        <Route
          path="/discussions"
          element={
            <ProtectedRoute>
              <Discussions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discussions/create"
          element={
            <ProtectedRoute>
              <CreateDiscussion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discussions/:id"
          element={
            <ProtectedRoute>
              <DiscussionDetails />
            </ProtectedRoute>
          }
        />

<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
<Route
  path="/developers"
  element={
    <ProtectedRoute>
      <Developers />
    </ProtectedRoute>
  }
/>
<Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;