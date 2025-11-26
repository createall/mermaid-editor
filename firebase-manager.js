import { auth, db, googleProvider, githubProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class FirebaseManager {
    constructor(onAuthChange) {
        this.user = null;
        this.onAuthChange = onAuthChange;

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (this.onAuthChange) {
                this.onAuthChange(user);
            }
        });
    }

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    }

    async loginWithGithub() {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            return result.user;
        } catch (error) {
            console.error("GitHub Login Error:", error);
            throw error;
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    }

    async saveDiagram(title, code, thumbnail = null) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            const docRef = await addDoc(collection(db, "diagrams"), {
                uid: this.user.uid,
                title: title,
                code: code,
                thumbnail: thumbnail,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    }

    async getUserDiagrams() {
        if (!this.user) return [];

        try {
            const q = query(
                collection(db, "diagrams"),
                where("uid", "==", this.user.uid),
                orderBy("updatedAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const diagrams = [];
            querySnapshot.forEach((doc) => {
                diagrams.push({ id: doc.id, ...doc.data() });
            });
            return diagrams;
        } catch (e) {
            console.error("Error getting documents: ", e);
            throw e;
        }
    }

    async deleteDiagram(diagramId) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            await deleteDoc(doc(db, "diagrams", diagramId));
            console.log("Document deleted with ID: ", diagramId);
            return true;
        } catch (e) {
            console.error("Error deleting document: ", e);
            throw e;
        }
    }

    async updateDiagram(diagramId, code, thumbnail = null) {
        if (!this.user) throw new Error("User not authenticated");

        try {
            const docRef = doc(db, "diagrams", diagramId);
            const updateData = {
                code: code,
                updatedAt: serverTimestamp()
            };
            if (thumbnail) {
                updateData.thumbnail = thumbnail;
            }
            await updateDoc(docRef, updateData);
            console.log("Document updated with ID: ", diagramId);
            return diagramId;
        } catch (e) {
            console.error("Error updating document: ", e);
            throw e;
        }
    }
}
