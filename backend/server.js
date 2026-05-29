const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/*
==================================
TEST ROUTE
==================================
*/

app.get("/", (req, res) => {
  res.send("Scholarship Backend Running");
});

/*
==================================
REGISTER USER
==================================
*/

app.post("/register", (req, res) => {
    const data = req.body;
  
    const id = `u-${Date.now()}`;
  
    const accountStatus =
      data.role === "admin" || data.role === "institution"
        ? "pending"
        : "active";
  
    const sql = `
      INSERT INTO users
      (
        id,
        email,
        password,
        role,
        name,
        phone,
        account_status,
        profile_complete,
        university,
        major,
        gpa,
        date_of_birth,
        student_id,
        department,
        organization,
        address,
        contact_person
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [
      id,
      data.email,
      data.password,
      data.role,
      data.name,
      data.phone,
      accountStatus,
      data.role === "student",
  
      data.university || null,
      data.major || null,
      data.gpa || null,
      data.dateOfBirth || null,
      data.studentId || null,
  
      data.department || null,
      data.organization || null,
      data.address || null,
      data.contactPerson || null,
    ];
  
    db.query(sql, values, (err) => {
  
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "Registration failed",
        });
      }
  
      res.json({
        id,
        email: data.email,
        password: data.password,
        role: data.role,
        name: data.name,
        phone: data.phone,
        accountStatus,
        profileComplete: data.role === "student",
        university: data.university || "",
        major: data.major || "",
        gpa: data.gpa || "",
        dateOfBirth: data.dateOfBirth || "",
        studentId: data.studentId || "",
      });
  
    });
  });

/*
==================================
LOGIN USER
==================================
*/

app.post("/login", (req, res) => {

    const { email, password, role } = req.body;

  const sql = `
    SELECT * FROM users
    WHERE email = ? AND password = ? AND role = ?
  `;

  db.query(
    sql,
    [email, password, role],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).send("Login Failed");
      } else {

        if (result.length > 0) {
            const user = result[0];
          
            if (user.account_status === "pending") {
              return res.status(403).json({ error: "Account pending verification" });
            }
          
            if (user.account_status === "rejected") {
              return res.status(403).json({ error: "Account rejected" });
            }
          
            return res.json({
                ...user,
                accountStatus: user.account_status,
                profileComplete: user.profile_complete,
                contactPerson: user.contact_person,
                dateOfBirth: user.date_of_birth,
                studentId: user.student_id,
              
                bankAccount: {
                  accountHolder: user.bank_account_holder || user.name || "",
                  bankName: user.bank_name || "",
                  accountNumber: user.bank_account_number || "",
                  routingNumber: user.bank_routing_number || "",
                },
              
                profilePicture: user.profile_photo
                  ? {
                      fileData: user.profile_photo,
                      mimeType: user.profile_photo_mime,
                    }
                  : null,
              });
          } else {
          res.status(401).send("Invalid Email or Password");
        }

      }

    }
  );

});

/*
==================================
GET ALL SCHOLARSHIPS
==================================
*/

app.get("/scholarships", (req, res) => {

  const sql = "SELECT * FROM scholarships";

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      res.status(500).send("Error Fetching Scholarships");
    } else {
      res.json(result);
    }

  });

});

/*
==================================
ADD SCHOLARSHIP
==================================
*/

app.post("/scholarships", (req, res) => {

  const {
    title,
    provider,
    amount,
    deadline,
    description
  } = req.body;

  const sql = `
    INSERT INTO scholarships
    (title, provider, amount, deadline, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, provider, amount, deadline, description],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).send("Failed to Add Scholarship");
      } else {
        res.send("Scholarship Added");
      }

    }
  );

});

/*
==================================
APPLY SCHOLARSHIP
==================================
*/

app.post("/apply", (req, res) => {

  const {
    user_id,
    scholarship_id,
    status
  } = req.body;

  const sql = `
    INSERT INTO applications
    (user_id, scholarship_id, status)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [user_id, scholarship_id, status],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).send("Application Failed");
      } else {
        res.send("Application Submitted");
      }

    }
  );

});

/*
==================================
START SERVER
==================================
*/
app.get("/pending-accounts", (req, res) => {
    const sql = `
      SELECT * FROM users
      WHERE role IN ('admin', 'institution')
      AND account_status = 'pending'
    `;
  
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: "Fetch failed" });
  
      const fixed = result.map((u) => ({
        ...u,
        accountStatus: u.account_status,
        contactPerson: u.contact_person,
        idProof: u.id_proof ? JSON.parse(u.id_proof) : null,
      }));
  
      res.json(fixed);
    });
  });
  
  app.put("/approve-account/:id", (req, res) => {
    db.query(
      "UPDATE users SET account_status = 'active' WHERE id = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: "Approval failed" });
        res.json({ success: true });
      }
    );
  });
  
  app.put("/reject-account/:id", (req, res) => {
    db.query(
      "UPDATE users SET account_status = 'rejected' WHERE id = ?",
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: "Rejection failed" });
        res.json({ success: true });
      }
    );
  });
  app.put("/users/:id/bank", (req, res) => {
    const { accountHolder, bankName, accountNumber, routingNumber } = req.body;
  
    const sql = `
      UPDATE users
      SET 
        bank_account_holder = ?,
        bank_name = ?,
        bank_account_number = ?,
        bank_routing_number = ?
      WHERE id = ?
    `;
  
    db.query(
      sql,
      [accountHolder, bankName, accountNumber, routingNumber, req.params.id],
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Bank details save failed" });
        }
  
        res.json({ success: true });
      }
    );
  });
  app.put("/users/:id/profile", (req, res) => {
    const data = req.body;
  
    const sql = `
      UPDATE users
      SET
        name = ?,
        phone = ?,
        university = ?,
        major = ?,
        gpa = ?,
        bank_account_holder = ?,
        bank_name = ?,
        bank_account_number = ?,
        bank_routing_number = ?,
        profile_photo = ?,
        profile_photo_mime = ?
      WHERE id = ?
    `;
  
    db.query(
      sql,
      [
        data.name,
        data.phone,
        data.university,
        data.major,
        data.gpa,
        data.bankAccount?.accountHolder || null,
        data.bankAccount?.bankName || null,
        data.bankAccount?.accountNumber || null,
        data.bankAccount?.routingNumber || null,
        data.profilePhoto || null,
        data.profilePhotoMime || null,
        req.params.id,
      ],
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Profile save failed" });
        }
  
        res.json({ success: true });
      }
    );
  });
  app.get("/users/email/:email", (req, res) => {
    db.query("SELECT * FROM users WHERE email = ?", [req.params.email], (err, result) => {
      if (err) return res.status(500).json({ error: "User fetch failed" });
      if (result.length === 0) return res.status(404).json({ error: "User not found" });
  
      const u = result[0];
  
      res.json({
        ...u,
        bankAccount: {
          accountHolder: u.bank_account_holder || "",
          bankName: u.bank_name || "",
          accountNumber: u.bank_account_number || "",
          routingNumber: u.bank_routing_number || "",
        },
      });
    });
  });
  app.get("/applications", (req, res) => {
    db.query("SELECT * FROM applications", (err, result) => {
      if (err) {
        console.log("GET APPLICATIONS ERROR:", err);
        return res.status(500).json({ error: "Applications fetch failed" });
      }
  
      res.json(result);
    });
  });
  app.post("/applications", (req, res) => {
    console.log("APPLICATION RECEIVED:", req.body);
    const a = req.body;
  
    const sql = `
      INSERT INTO applications
      (
        id,
        scholarship_id,
        scholarship_title,
        student_id,
        student_name,
        student_email,
        status,
        institution_status,
        forwarded_to_admin,
        essay,
        notes,
        remarks,
        applied_at,
        fund_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(
      sql,
      [
        a.id,
        a.scholarshipId,
        a.scholarshipTitle,
        a.studentId,
        a.studentName,
        a.studentEmail,
        a.status || "institution-review",
        a.institutionStatus || "pending",
        a.forwardedToAdmin ? 1 : 0,
        a.essay || "",
        a.notes || "",
        JSON.stringify(a.remarks || []),
        a.appliedAt,
        a.fundStatus || null,
      ],
      (err) => {
        if (err) {
          console.log("APPLICATION ERROR:", err);
          return res.status(500).json({
            error: "Application save failed",
            details: err.message,
          });
        }
  
        res.json({ success: true });
      }
    );
  });
  app.post("/documents", (req, res) => {
  const d = req.body;

  const sql = `
    INSERT INTO documents
    (
      id,
      student_id,
      student_name,
      application_id,
      scholarship_id,
      name,
      type,
      file_name,
      file_data,
      mime_type,
      uploaded_at,
      verified,
      verified_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      d.id,
      d.studentId,
      d.studentName,
      d.applicationId || null,
      d.scholarshipId || null,
      d.name,
      d.type,
      d.fileName,
      d.fileData,
      d.mimeType,
      d.uploadedAt,
      d.verified ? 1 : 0,
      d.verifiedBy || null,
    ],
    (err) => {
      if (err) {
        console.log("DOCUMENT SAVE ERROR:", err);
        return res.status(500).json({
          error: "Document save failed",
          details: err.message,
        });
      }

      res.json({ success: true });
    }
  );
});

app.get("/documents", (req, res) => {
  db.query("SELECT * FROM documents", (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: "Fetch failed",
      });
    }

    res.json(result);
  });
});

app.delete("/documents/:id", (req, res) => {
  db.query(
    "DELETE FROM documents WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "Delete failed",
        });
      }

      res.json({ success: true });
    }
  );
});
app.listen(5050, () => {
    console.log("Server running on port 5050");
  });