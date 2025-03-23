import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notice.component.html',
  styleUrls: ['./notice.component.css']
})
export class NoticeComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  postTitle: string = '';
  postContent: string = '';
  posts: any[] = [];
  userRole: string = '';
  userSchool: string = '';
  schools: string[] = ['SPSIT', 'GKNM', 'GCA', 'GYMB'];
  roles: string[] = ['admin', 'student', 'teacher'];

  async ngOnInit() {
    await this.loadUserDetails();
    await this.loadPosts();
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async loadUserDetails() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(this.firestore, `users/${currentUser.uid}`);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userDetails = userDocSnap.data();
        this.userRole = userDetails['userTypeRole'];
        this.userSchool = userDetails['school'];
      }
    }
  }

  async createPost() {
    const currentUser = this.auth.currentUser;
    if (currentUser && (this.userRole === 'admin' || this.userRole === this.userSchool)) {
      const post = {
        title: this.postTitle,
        content: this.postContent,
        author: currentUser.displayName || 'Anonymous',
        authorId: currentUser.uid,
        school: this.userSchool,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(this.firestore, 'notices'), post);
      this.postTitle = '';
      this.postContent = '';
      await this.loadPosts();
    } else {
      console.warn('You are not authorized to create a post.');
    }
  }

  async loadPosts() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const q = query(collection(this.firestore, 'notices'), where('school', '==', this.userSchool));
      const querySnapshot = await getDocs(q);
      this.posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }
}

