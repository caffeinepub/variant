import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

actor {
  public type MasterQuestion = {
    id : Nat;
    text : Text;
    subject : Text;
    chapter : Text;
    topic : Text;
    solutionSteps : [Text];
    originalNumbers : [Text];
    createdAt : Int;
  };

  public type Variant = {
    id : Nat;
    masterId : Nat;
    questionText : Text;
    answer : Text;
    mcqOptions : [Text];
    correctIndex : Nat;
    decimalMode : Bool;
    fractionMode : Bool;
    createdAt : Int;
  };

  type InternalStats = {
    var nextMasterId : Nat;
    var nextVariantId : Nat;
    var masterQuestions : Map.Map<Nat, MasterQuestion>;
    var variants : Map.Map<Nat, Variant>;
  };

  var stats : ?InternalStats = null;

  module InternalStats {
    public func fromPersistent(data : PersistentStats) : InternalStats {
      {
        var nextMasterId = data.nextMasterId;
        var nextVariantId = data.nextVariantId;
        var masterQuestions = Map.empty<Nat, MasterQuestion>();
        var variants = Map.empty<Nat, Variant>();
      };
    };

    public func toPersistent(stats : InternalStats) : PersistentStats {
      {
        nextMasterId = stats.nextMasterId;
        nextVariantId = stats.nextVariantId;
      };
    };
  };

  func getOrCreateStats() : InternalStats {
    switch (stats) {
      case (?existing) { existing };
      case (null) {
        let newStats : InternalStats = {
          var nextMasterId = 1;
          var nextVariantId = 1;
          var masterQuestions = Map.empty<Nat, MasterQuestion>();
          var variants = Map.empty<Nat, Variant>();
        };
        stats := ?newStats;
        newStats;
      };
    };
  };

  func getStatsForDeserialization() : InternalStats {
    switch (stats) {
      case (?existing) { existing };
      case (null) { Runtime.trap("No stats found during deserialization") };
    };
  };

  public type Stats = {
    totalQuestions : Nat;
    totalVariants : Nat;
  };

  type PersistentStats = {
    nextMasterId : Nat;
    nextVariantId : Nat;
  };

  module MasterQuestion {
    public func compare(a : MasterQuestion, b : MasterQuestion) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Variant {
    public func compare(a : Variant, b : Variant) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func searchMasterQuestions(searchTerm : Text, field : (MasterQuestion) -> Text) : [MasterQuestion] {
    let searchTermLower = searchTerm.toLower();
    let stats = getOrCreateStats();
    stats.masterQuestions.values().toArray().filter(
      func(mq) {
        field(mq).toLower().contains(#text searchTermLower);
      }
    );
  };

  public shared ({ caller }) func createMasterQuestion(text : Text, subject : Text, chapter : Text, topic : Text, solutionSteps : [Text], originalNumbers : [Text]) : async Nat {
    let stats = getOrCreateStats();
    let id = stats.nextMasterId;
    let mq : MasterQuestion = {
      id;
      text;
      subject;
      chapter;
      topic;
      solutionSteps;
      originalNumbers;
      createdAt = Time.now();
    };
    stats.masterQuestions.add(id, mq);
    stats.nextMasterId += 1;
    id;
  };

  public query ({ caller }) func listAllMasterQuestions() : async [MasterQuestion] {
    let stats = getOrCreateStats();
    stats.masterQuestions.values().toArray().sort();
  };

  public query ({ caller }) func getMasterQuestion(id : Nat) : async ?MasterQuestion {
    let stats = getOrCreateStats();
    stats.masterQuestions.get(id);
  };

  public query ({ caller }) func searchMasterQuestionsByTopic(searchTerm : Text) : async [MasterQuestion] {
    searchMasterQuestions(searchTerm, func(mq) { mq.topic });
  };

  public query ({ caller }) func searchMasterQuestionsByChapter(searchTerm : Text) : async [MasterQuestion] {
    searchMasterQuestions(searchTerm, func(mq) { mq.chapter });
  };

  public query ({ caller }) func searchMasterQuestionsBySubject(searchTerm : Text) : async [MasterQuestion] {
    searchMasterQuestions(searchTerm, func(mq) { mq.subject });
  };

  public shared ({ caller }) func createVariant(masterId : Nat, questionText : Text, answer : Text, mcqOptions : [Text], correctIndex : Nat, decimalMode : Bool, fractionMode : Bool) : async Nat {
    let stats = getOrCreateStats();
    let id = stats.nextVariantId;
    let variant : Variant = {
      id;
      masterId;
      questionText;
      answer;
      mcqOptions;
      correctIndex;
      decimalMode;
      fractionMode;
      createdAt = Time.now();
    };
    stats.variants.add(id, variant);
    stats.nextVariantId += 1;
    id;
  };

  public query ({ caller }) func getVariant(id : Nat) : async ?Variant {
    let stats = getOrCreateStats();
    stats.variants.get(id);
  };

  public query ({ caller }) func listVariantsByMasterId(masterId : Nat) : async [Variant] {
    let stats = getOrCreateStats();
    stats.variants.values().toArray().filter(
      func(variant) {
        variant.masterId == masterId;
      }
    );
  };

  public shared ({ caller }) func deleteMasterQuestion(id : Nat) : async () {
    let stats = getOrCreateStats();
    if (not stats.masterQuestions.containsKey(id)) {
      Runtime.trap("Master Question not found");
    };
    stats.masterQuestions.remove(id);
  };

  public shared ({ caller }) func deleteVariant(id : Nat) : async () {
    let stats = getOrCreateStats();
    if (not stats.variants.containsKey(id)) {
      Runtime.trap("Variant not found");
    };
    stats.variants.remove(id);
  };

  public query ({ caller }) func getStats() : async Stats {
    let stats = getOrCreateStats();
    {
      totalQuestions = stats.masterQuestions.size();
      totalVariants = stats.variants.size();
    };
  };

  public query ({ caller }) func exportData() : async Text {
    "{}";
  };

  public shared ({ caller }) func importData(jsonText : Text) : async () {
    let persistentStats : PersistentStats = {
      nextMasterId = 0;
      nextVariantId = 0;
    };
    let newStats = InternalStats.fromPersistent(persistentStats);
    stats := ?newStats;
  };
};
