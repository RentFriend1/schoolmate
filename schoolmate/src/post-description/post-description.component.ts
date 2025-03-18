import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-post-description',
  templateUrl: './post-description.component.html',
  styleUrls: ['./post-description.component.css']
})
export class PostDescriptionComponent implements OnInit {
  post: any = null;

  constructor(private route: ActivatedRoute, private firestore: Firestore) { }

  async ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      const postDoc = await getDoc(doc(this.firestore, 'posts', postId));
      if (postDoc.exists()) {
        this.post = postDoc.data();
      }
    }
  }
}
