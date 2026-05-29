import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../widgets/AppLayout";
import { EnrollmentRequestPage } from "../pages/enrollment/EnrollmentRequestPage";
import { EnrollmentStatusPage } from "../pages/enrollment/EnrollmentStatusPage";
import { SetPasswordPage } from "../pages/auth/SetPasswordPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { SchedulePage } from "../pages/SchedulePage";
import { DashboardPage } from "../pages/DashboardPage";
import { ParentCabinetPage } from "../pages/cabinet/ParentCabinetPage";
import { ChildCabinetPage } from "../pages/cabinet/ChildCabinetPage";
import { TeacherCabinetPage } from "../pages/cabinet/TeacherCabinetPage";
import { AdminEnrollmentsPage } from "../pages/admin/AdminEnrollmentsPage";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminStudentsPage } from "../pages/admin/AdminStudentsPage";
import { AdminStudentProfilePage } from "../pages/admin/AdminStudentProfilePage";
import { AdminParentsPage } from "../pages/admin/AdminParentsPage";
import { AdminParentProfilePage } from "../pages/admin/AdminParentProfilePage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminClassesPage } from "../pages/admin/AdminClassesPage";
import { AdminLessonsPage } from "../pages/admin/AdminLessonsPage";
import { AdminParentStudentLinksPage } from "../pages/admin/AdminParentStudentLinksPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRoles } from "./guards/RequireRoles";
import { RedirectIfAuth } from "./guards/RedirectIfAuth";
import { RoleHomeRedirect } from "./guards/RoleHomeRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "enrollment-request",
        element: <EnrollmentRequestPage />
      },
      {
        path: "enrollment-status",
        element: <EnrollmentStatusPage />
      },
      {
        path: "enrollment-status/:requestId",
        element: <EnrollmentStatusPage />
      },
      {
        path: "set-password",
        element: <SetPasswordPage />
      },
      {
        element: <RedirectIfAuth />,
        children: [
          {
            path: "login",
            element: <LoginPage />
          }
        ]
      },
      {
        element: <RequireAuth />,
        children: [
          {
            index: true,
            element: <RoleHomeRedirect />
          },
          {
            path: "home",
            element: <DashboardPage />
          },
          {
            element: <RequireRoles allowed={["parent"]} />,
            children: [
              {
                path: "cabinet/parent",
                element: <ParentCabinetPage />
              }
            ]
          },
          {
            element: <RequireRoles allowed={["child"]} />,
            children: [
              {
                path: "cabinet/child",
                element: <ChildCabinetPage />
              }
            ]
          },
          {
            element: <RequireRoles allowed={["teacher"]} />,
            children: [
              {
                path: "cabinet/teacher",
                element: <TeacherCabinetPage />
              }
            ]
          },
          {
            element: <RequireRoles allowed={["parent", "child", "teacher"]} />,
            children: [
              {
                path: "schedule",
                element: <SchedulePage />
              }
            ]
          },
          {
            element: <RequireRoles allowed={["admin"]} />,
            children: [
              {
                path: "admin",
                element: <AdminLayout />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="enrollments" replace />
                  },
                  {
                    path: "enrollments",
                    element: <AdminEnrollmentsPage />
                  },
                  {
                    path: "classes",
                    element: <AdminClassesPage />
                  },
                  {
                    path: "lessons",
                    element: <AdminLessonsPage />
                  },
                  {
                    path: "parent-student-links",
                    element: <AdminParentStudentLinksPage />
                  },
                  {
                    path: "students",
                    element: <AdminStudentsPage />
                  },
                  {
                    path: "teachers",
                    element: <AdminUsersPage />
                  },
                  {
                    path: "users",
                    element: <Navigate to="/admin/teachers" replace />
                  },
                  {
                    path: "students/:studentId",
                    element: <AdminStudentProfilePage />
                  },
                  {
                    path: "parents",
                    element: <AdminParentsPage />
                  },
                  {
                    path: "parents/:parentId",
                    element: <AdminParentProfilePage />
                  }
                ]
              }
            ]
          },
          {
            path: "*",
            element: <NotFoundPage />
          }
        ]
      }
    ]
  }
]);
