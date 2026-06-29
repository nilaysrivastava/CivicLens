import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Role, getUserRole } from "../lib/roles";

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isCitizen: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isSignedIn: false,
  isAdmin: false,
  isCitizen: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRole = getUserRole(firebaseUser);
        setRole(userRole);
        
        // Sync user document to Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          let finalRole = userRole;
          
          const demoWorkspace = sessionStorage.getItem("demoWorkspace");
          let judgeMode = false;
          let judgeWorkspace = null;

          if (demoWorkspace) {
            sessionStorage.removeItem("demoWorkspace");
            if (demoWorkspace === "admin" || demoWorkspace === "citizen") {
              finalRole = demoWorkspace;
              judgeMode = true;
              judgeWorkspace = demoWorkspace;
            }
          } else if (docSnap.exists() && docSnap.data().role) {
             finalRole = docSnap.data().role;
          }

          setRole(finalRole);

          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || "",
              role: finalRole,
              ...(judgeMode ? { judgeMode: true, judgeWorkspace } : {}),
              trustScore: 50,
              reportsCount: 0,
              validationsCount: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            // Update last login or other necessary info if needed
            await setDoc(userDocRef, {
              updatedAt: serverTimestamp(),
              role: finalRole,
              ...(judgeMode ? { judgeMode: true, judgeWorkspace } : {}),
            }, { merge: true });
          }
        } catch (error) {
          console.error("Error syncing user document:", error);
          // Don't throw, we still want to log the user in
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isSignedIn: !!user,
        isAdmin: role === "admin",
        isCitizen: role === "citizen",
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
